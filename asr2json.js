/**********************************
 Require
 **********************************/
var fs = require('fs');
var path = require('path');
var lineByLineReader = require('line-by-line');
var pdftotext = require('pdftotextjs');
/**********************************
 Global Variables
 **********************************/
var field = {
    "asogVersion": "",
    "processed": "",
    "form": "",
    "section": "",
    "name": "",
    "title": "",
    "fieldNumber": "",
    "minimumLength": "",
    "maximumLength": "",
    "characteristics": "",
    "usage": "",
    "examples": "",
    "example": "",
    "definition": "",
    "validEntry": "",
    "validEntryNotes": "",
    "usageNotes": "",
    "fieldNotes": "",
    "exampleNotes": ""
};
field.fieldNumber = 0;
var fileContent = [];       //text from the file written by consolidator
field.keywordFlag = true;     //if the keyword is encountered
var tillEntries = 0;    //for valid entries
var state = 0;
field.nextForm = "";
field.nextSection = "";
var outputDir = '';
var asyncPdf = '';

runAsr2Json.apply(null, process.argv.slice(2));

function runAsr2Json(pathToPDF, outputPath, startPageNo, endPageNo) {
    var args = Array.prototype.slice.call(arguments);
    var missingParams = ['pathToPDF', 'outputPath', 'startPageNo', 'endPageNo'].filter(function (param, i) {
        return (typeof args[i] === 'undefined');
    });
    if (missingParams.length) {
        throw new Error([
            'asr2json is missing parameter' + (missingParams.length > 1 ? 's' : ''),
            ' ' + missingParams.join(', ')
        ].join(''));
    }
    else {
        outputDir = outputPath;
        var tmpDirPath = __dirname + '/temp';
        mkdir(outputPath);
        mkdir(tmpDirPath);
        asyncPdf = new pdftotext(pathToPDF);
        asyncPdf.add_options(['-f ' + startPageNo, '-l ' + endPageNo, '-layout']);
        asyncPdf.getText(function (err, obtainedData, cmd) {

            if (err) {
                console.error('\n Error :' + err);
            }
            else {
                var writablestream = fs.createWriteStream('temp/asyncAsrOutputTxt');
                writablestream.write(obtainedData);
                writablestream.end();
                writablestream.on('finish', function () {
                    // do stuff
                    read();

                });

            }
        });

    }
};


function mkdir(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
}

//TODO formNumber( if applicable)

/**
 * Read the stream
 */
function read() {
    lr = new lineByLineReader('temp/asyncAsrOutputTxt', {skipEmptyLines: true});
    lr.on('error', function (err) {
        console.log('\n Error occurred reading the line : ' + err)
    });

    lr.on('line', function (line) {
        fileContent.push(line.trim());
    });

    lr.on('end', function (line) {
        clear();
        processedAt();          //store the processing date-time
        for (var i = 0; i < fileContent.length; i++) {
            parseLine((fileContent[i]));
            if (i == fileContent.length - 1) { //for the last field
                getDescription(field.content);
                writeToFile();
            }
        }

    });

}

/**
 * Process the pdf, line by line.
 */
function parseLine(lines) {
    if (state == 0) {
        isForm(lines);
        isSection(lines);
        isField(lines);
    } else if (state == 1) {
        isSection(lines);
    } else if (state == 2) {
        isField(lines);
    } else if (state == 3) {
        getFieldInfo(lines);
    }
}


/**
 * Check if the line indicates the start of a form.
 */
function isForm(line) {
    var re = /^3\./;    //Change the formNumber according to the formNumber on the pdf
    if (re.exec(line) != null && line.indexOf("FORM") > -1) {
        getFormInfo(line);
        state = 1;
    }
}

/**
 * Check if the line indicates the start of a section.
 */
function isSection(line) {
    var re = /^3\.\d/;
    if (re.exec(line) != null && line.indexOf("SECTION") > -1) {
        getSectionInfo(line);
        state = 2;
    }
}


/**
 * Check if the line indicates the start of a field.
 */
function isField(line) {
    var re = /^\d+\.\s*[A-Z].*/;
    var titleLine = line.replace(/\s/g, "");
    var reg = /^\d+\. [A-Z].*/
    if (re.exec(titleLine) != null || reg.exec(titleLine) != null) {
        getFieldInfo(line);
        state = 3;
    }
}


/**
 * Get the form name and create a directory with the name, if there is none created
 */
function getFormInfo(line) {
    field.nextForm = line.substring(line.indexOf("(") + 1, line.indexOf(")"));
    field.nextForm = field.nextForm.replace("/", ":");
}


/**
 * Get the section name
 */
function getSectionInfo(line) {
// Get section number and use it to find if the next 3.x is section number + 1
    field.nextSection = String(line.match(/[a-z.*A-Z ]+$/));
    field.nextSection = ((field.nextSection.split(" SECTION"))[0]).trim();
}


/**
 * Get the field info and add in the field object
 */
function getFieldInfo(line) {
    line = line.trim();
    var prevFieldNumber = field.fieldNumber;    //store the previous fieldNumber
    var previous = field.previousField;     //store the previous field
    var lineConsidered = 0;                     //if the line is already considered
    var newPage = isNewPage(line);

    // Added to detect multiple examples lines without Examples keyword
    if (isNewPage(line) === false) {
        if (line.match(/^EXAMPLES:.*/) === null && field.previousField == "examples") {
            getExample(line);
        }
    }


    if (newPage) {    //ignore the line number, use it to store the info as no other keyword will be seen
        getDescription(field.content);
        field.content = "";
        previous = "";
    }
    if (line.match(/^ATIS.*/) != null) {   //ignore the lines
        previous = "";
        getVersion(line);       //use atis for the version number
        state = 0;              //new page, search for form, section, field
    }
    var re = /^\d+(\.).*/;
    if (re.exec(line)) {
        if (line.indexOf("-") > -1 || line.indexOf("–") > -1) {
            field.fieldNumber = String((line).match(/\d+/));
            if (prevFieldNumber == field.fieldNumber - 1) {
                if (field.form == "") {
                    field.form = field.nextForm;
                    field.section = field.nextSection;
                }
                lineConsidered = field.fieldNumber;
                field.fieldNumber = prevFieldNumber;
                writeToFile();
                clear();
                field.form = field.nextForm;
                field.section = field.nextSection;
                field.fieldNumber = lineConsidered;
                getTitle(line);
                field.previousField = "field";
                lineConsidered = 1;
            } else {
                field.fieldNumber = prevFieldNumber;
                previous = "";
            }
        }
    }
    var reg = /^[A-Z0-9 ]+=.*/;
    field.keywordFlag = checkKeyword(line);
    if (field.keywordFlag != false) {
        getDescription(field.content);
        field.content = "";
        getKeyword(line);
    }
    else if (field.previousField != "field" && previous === field.previousField) {
        if (field.previousField != "valid entry" && field.previousField != "validEntryNotes") {
            field.content = field.content + "  " + line;
        } else if (reg.exec(line) != null && field.previousField === "validEntryNotes") {
            if (line.indexOf("=") > -1) {
                processValidEntry(line);
            } else {
                field.content = field.content + " " + line;
            }
        } else {
            field.content = field.content + " " + line;
        }
    } else if (field.previousField === "field" && lineConsidered != 1) {
        getDefinition(line);
    }
}


/**
 * Check for keyword in the line
 */
function checkKeyword(line) {
    var re = /^(NOTE)s*/;
    if (line.match(/^VALID ENTRIES:.*/) != null || line.match(/^USAGE:.*/) != null || line.match(/^DATA CHARACTERISTICS:.*/) != null || line.match(/^EXAMPLE:.*/) != null || line.match(/^EXAMPLES:.*/) != null) {
        return true;
    } else if (re.exec(line) != null) {
        return true;
    } else {
        return false
    }
}


/**
 * Return the version from the line
 */
function getVersion(line) {
    var re = /^(ATIS)+(\-)\d+(\-)\d+/;
    if (re.exec(line)) {
        var words = line.split(" ");
        field.asogVersion = words[0].substring(words[0].length - 4, words[0].length);
    }
}


/**
 * Store processing information (Date-time)
 */
function processedAt() {
    field.processed = new Date();
}


/**
 * Retrieve title
 */
function getTitle(line) {
    var re = /\d+\.s*([A-Z]+[\–\-][A-Z\–\-\s*]+?)([A-Z][a-z].*)/;
    if (re.exec(line)) {         //More than one hyphen
        var title = re.exec(line);
        field.title = title[1].trim().replace(/[\–\-]$/, "");
        field.name = title[2];
    } else {                                         //Only one hyphen
        var reg = /[0-9]+\.(.*)[\-\–](.*)/;
        field.title = reg.exec(line)[1].trim();
        field.name = reg.exec(line)[2].trim();
        if (line.indexOf("(") > -1 && line.indexOf(")") > -1) {
            field.title = field.title + " " + line.substring(line.indexOf("(") + 1, line.indexOf(")"));
        }
    }
}

/**
 * Retrieve definition info
 */
function getDefinition(line) {
    field.definition = field.definition + " " + line;
}


/**
 * Retrieve the keyword. The lines following will be the description for the keyword
 */
function getKeyword(line) {
    line = line.trim();
    var re = /^(NOTE)s*/;
    var reg = /^(NOTE)s*\d+:/;
    if (re.exec(line) != null) {
        switch (field.previousField) {
            case "field":
            case "fieldNotes":
                field.previousField = "fieldNotes";
                getNotes(line);
                break;
            case "valid entry":
            case "validEntryNotes":
                field.previousField = "validEntryNotes";
                getNotes(line);
                break;
            case "usage":
            case "usageNotes":
                field.previousField = "usageNotes";
                getNotes(line);
                break;
            case "exampleNotes":
                field.previousField = "exampleNotes";
                getNotes(line);
                break;
            default:
//                console.log("default");
        }
    } else if (line.indexOf("VALID ENTRIES") > -1) {
        field.previousField = "valid entry";
    } else if (line.indexOf("USAGE") > -1) {
        field.previousField = "usage";
        if (line.indexOf("required") > -1) {
            field.usage = "Required";
        } else if (line.indexOf("conditional") > -1) {
            field.usage = "Conditional";
        } else if (line.indexOf("optional") > -1) {
            field.usage = "Optional";
        }
    } else if (line.indexOf("DATA CHARACTERISTICS") > -1) {
        field.previousField = "data";
        line = line.replace(/\n/g, " ");
        getLength(line);
    } else if (line.match(/^EXAMPLES:.*/) != null) {
        field.previousField = "examples"
        getExample(line);
    } else if (line.match(/^EXAMPLE:.*/) != null) {
        field.previousField = "example";
        getExample(line);
    }
}

/**
 * Extract notes if the keyword's on the same line
 */
function getNotes(line) {
    line = line.trim();
    line = (line.substring(line.indexOf(":") + 1, line.length));
    if (line != " ") {
        field.content = field.content + line;
    }
}

/**
 * Retrieve description and store in the respective keywords in the field object
 */
function getDescription(line) {
    var re = /^3-\d+$/;
    if (re.exec(line) == null && line != "") {
        line = line.trim();
        switch (field.previousField) {
            case "fieldNotes":
                line = line.replace(/\n/g, " ");
                field.fieldNotes.push(line);
                break;
            case "validEntryNotes":
                line = line.replace(/\n/g, " ");
                field.validEntryNotes.push(line);
                break;
            case "usageNotes":
                line = line.replace(/\n/g, " ");
                field.usageNotes.push(line);
                break;
            case "exampleNotes":
                line = line.replace(/\n/g, " ");
                field.exampleNotes.push(line);
                break;
            case "valid entry":
                processValidEntry(line);
                break;
            case "data":
                line = line.replace(/\n/g, " ");
                getLength(line);
                break;
            case "example":
                break;
            case "usage":
                if (line.indexOf("required") > -1) {
                    field.usage = "Required";
                } else if (line.indexOf("conditional") > -1) {
                    field.usage = "Conditional";
                } else if (line.indexOf("optional") > -1) {
                    field.usage = "Optional";
                }
                break;
            default:
        }
    }
}


/**
 * Retrieve valid entry information for the field
 */
function processValidEntry(line) {
    var entries = line.split("\n");
    for (var entryCounter = 0; entryCounter < entries.length; entryCounter++) {
        field.validEntry[tillEntries] = {};
        if (entries[entryCounter].indexOf("=") > -1) {
            field.validEntry[tillEntries].value = entries[entryCounter].split("=")[0].trim();
            field.validEntry[tillEntries].description = entries[entryCounter].split("=")[1].trim();
        } else {
            field.validEntry[tillEntries].value = "";
            field.validEntry[tillEntries].description = entries[entryCounter];
        }
        tillEntries++;
    }
}

function getExample(line) {
    line = line.trim();

    if (line.match(/^EXAMPLES:.*/) != null) {
        line = line.replace(/\s/g, '')
        var values = line.split(":");
        if (values.length > 1) {
            field.examples.push(values[1].trim());
        }

    }

    if (line.match(/^EXAMPLE:.*/) != null) {
        line = line.replace(/\s/g, '')
        var values = line.split(":");
        if (values.length > 1) {
            field.example = values[1].trim();
        }
    }


    if (isNewPage(line.trim())) {
        field.previousField = "";
        previous = "";

    }

    if (((line.match(/^EXAMPLES:.*/) === null) && field.previousField == "examples")) {
        if (isNewPage(line) === false) {
            line = line.replace(/\s/g, '')
            if (field.examples) {
                if (((line.length >= 1 && line.length <= field.maximumLength) && line != null && line != "")) {
                    field.examples.push(line.trim());
                }
            }
        } else {
            if (isNewPage(line) === true) {
                field.previousField = "";
                previous = "";

            }
        }

    }
}

/**
 * Retrieve the minimum and maximum length for the field
 */
function getLength(line) {
    line = line.trim();
    //console.log('\n getLength : ' + line);
    if ((line.indexOf("maximum") > -1) && (line.indexOf("minimum") > -1)) {
        var values = line.split(",");
        for (var i = 0; i < values.length; i++) {
            getLengthValues(values[i]);
        }
    } else {
        field.minimumLength = "";
        getLengthValues(line);
    }
}


/**
 * Retrieve the characteristics and length if only one data value is specified
 */
function getLengthValues(line) {
    line = line.trim();
    var values = line.split(":");

    if (values.length > 1 && line.indexOf("minimum") > -1) {
//        var length = parseInt(values[0]);                 //convert to int
        field.minimumLength = values[1];
    } else if (values.length > 1) {
//        var length = parseInt(values[0]);
        var newValues = values[1].trim().split(" ");
        //console.log('\n New Values :'+newValues);
        field.maximumLength = newValues[0];
    }
    if (line.indexOf("alpha") > -1) {
        field.characteristics = "Alpha";
        if (line.indexOf("numeric") > -1) {
            field.characteristics = "AlphaNumeric";
        }
    } else if (line.indexOf("numeric") > -1) {
        field.characteristics = "Numeric";
    }
}


/**
 * Check if the line indicates the start of a new page
 */
function isNewPage(line) {
    line = line.trim();
    var re = /^3-\d+$/;
    if (re.exec(line) != null) {
        return true;
    }
    return false;
}


/**
 * Initialize and clear previous values stored
 */
function clear() {
    field.previousField = "";
    field.definition = "";
    field.example = "";
    field.examples = [];
    field.content = "";
    tillEntries = 0;
    field.fieldNotes = [];
    field.usageNotes = [];
    field.validEntryNotes = [];
    field.validEntry = [];
    field.exampleNotes = [];
}


/**
 * Write the output to the file
 */
function writeToFile() {
    var title = field.title;
    title = title.replace('/', ':');
    if (parseInt(field.fieldNumber, 10) !== 0) {
        var formPath = path.join(outputDir, field.form);
        mkdir(formPath);
        var fieldPath = formPath + '/' + title + ".json";
        fs.writeFile(fieldPath, JSON.stringify(field, replacer, 4), function (err) {
            if (err) {
                return console.log(err);
            }
        });
    }
}


/**
 * Replace the keys that should not be displayed/written to a file
 * example is removed as the format is not right
 */
function replacer(key, value) {
    if (key == "keywordFlag" || key == "previousField" || key == "content" || key == "nextSection" || key == "nextForm") {
        return undefined;
    }
    return value;
}

