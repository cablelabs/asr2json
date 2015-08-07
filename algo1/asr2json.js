//var pdfConverter = require('/Users/wlopes/IdeaProjects/node_modules/pdf2json');
var fs = require('fs');
var fileName = "";
var startPageNo = "" ;
var endPageNo = "";
var execute = require('child_process').exec;
var jsonConsolidator = require("./jsonConsolidator.js");

process.argv.forEach(function(val, index, array){
    switch(index){
        case 2:
            fileName = val;
            break;
        case 3:
            startPageNo = val;
            break;
        case 4:
            endPageNo = val;
            break;
        default:
            break;
    }
});

/**
* Split the pdf based on page number
*/
var command = 'python splitPDF.py ' + fileName + ' ' + startPageNo + ' ' +endPageNo;
child = execute(command, function (error, stdout, stderr) {
    if (error !== null) {
      console.log('exec error: ' + error);
    }else{

    /**
    * Convert the pdf to json
    */
        fileName = fileName.substring(0,fileName.indexOf("."));
        child = execute('pdf2json -f ' + fileName + '.' + startPageNo + '_' +endPageNo + '.pdf -s',{maxBuffer: 2056 * 500},function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }else{
                fileName = fileName + '.' + startPageNo + '_' +endPageNo + '.json';
                consolidate(fileName);
            }
        });
    }
});

/**
* Consolidator for lines based on y-coordinate, written to a text file
*/
function consolidate(fileName){
    var jsonConsolidator = require("./jsonConsolidator.js");
    jsonConsolidator.jsonCon(fileName);
    read();
}

//TODO formNumber( if applicable)

var field = {"asogVersion": "", "processed": "", "form": "", "section": "", "name": "", "title": "", "fieldNumber": "", "minimumLength": "", "maximumLength": "", "characteristics": "", "usage": "", "example": "", "definition": "", "validEntry": "", "validEntryNotes": "", "usageNotes": "", "fieldNotes": "", "exampleNotes": ""};
field.fieldNumber = 0;
var fileContent = [];       //text from the file written by consolidator
field.keywordFlag = true;     //if the keyword is encountered
var tillEntries = 0;    //for valid entries

//read asynchronously
//fs.readFile("parsedText", "utf8", function (error, data) {
//    if(error){
//        console.log(error);
//    }
//    lines = data;
//    parseLine(lines);
//});

/**
* Read the stream
*/
function read(){
    var readableStream = fs.createReadStream('parsedText');
    var data = ' ';
    readableStream.setEncoding('utf8');
    readableStream.on('data',function(chunk){
        data = data + chunk;
    });
    readableStream.on('end',function(){
        fileContent = data.split("\n");
        clear();
        for(var i = 0; i< fileContent.length;i++){
            parseLine(fileContent[i]);
            if(i == fileContent.length -1){ //for the last field
                getDescription(field.content);
                writeToFile();
            }
        }
    });
}



/**
* Process the pdf, line by line.
*/
function parseLine(lines){
    var information = lines.split("\n");
    state = 1; // 1. form, 2. section, 3. field
    var i = 0;
    while(i<information.length){
        processedAt();          //store the processing date-time
//        check for form if state is 1
        state = isForm(information[i]);

        state = isSection(information[i]);
//        check for section if state is 2

        isField(information[i],state);
        i++;
    }
}


/**
* Check if the line indicates the start of a form.
*/
function isForm(line){
    var re = /^3\./;
    if(re.exec(line) != null && line.indexOf("FORM") > -1){
        getFormInfo(line);
        return 2;
    }
    return 1;
}


/**
* Check if the line indicates the start of a section.
*/
function isSection(line){
    var re = /^3\.\d/;

    if(re.exec(line) != null && line.indexOf("SECTION") > -1){
        getSectionInfo(line);
        return 3;
    }
    return 2;
}


/**
* Check if the line indicates the start of a field.
*/
function isField(line,state){
    var newPage = isNewPage(line);
    var re = /^\d\.s*[A-Z].*/;
    if(newPage){
        state = 5;
    }else if(re.exec(line) != null){
    }
//    console.log(newPage);
//    if new page, check for form/section/fieldTitle
//    isForm(line);
//    isSection(line);
    getFieldInfo(line);
}


/**
* Get the form name and create a directory with the name, if there is none created
*/
function getFormInfo(line){
    field.form = line.substring(line.indexOf("(")+1, line.indexOf(")"));
    var directory = "./" + field.form;
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }
}


/**
* Get the section name
*/
function getSectionInfo(line){
// Get section number and use it to find if the next 3.x is section number + 1
    field.section = String(line.match(/[a-z.*A-Z ]+$/));
    field.section = (field.section.split(" SECTION"))[0];
}


/**
* Get the field info and add in the field object
*/
function getFieldInfo(line){
    var prevFieldNumber = field.fieldNumber;    //store the previous fieldNumber
    var previous = field.previousField;     //store the previous field
    var lineConsidered = 0;                     //if the line is already considered
    var newPage = isNewPage(line);
    if(newPage){    //ignore the line number, use it to store the info as no other keyword will be seen
        getDescription(field.content);
        field.content = "";
        previous = "";
    }
    if(line.indexOf("ATIS") > -1 || line.indexOf("Issued") > -1 || line.indexOf("Implemented") > -1){   //ignore the lines
        previous = "";
    }
    getVersion(line);       //use atis for the version number
    var re = /^\d+(\.).*/;
    if(re.exec(line)){
        if(line.indexOf("-") > -1 || line.indexOf("–") > -1){
            hyphen = line.indexOf("-") > -1 ? "-" : "–";
            field.fieldNumber = String((line).match(/\d+/));
            if(prevFieldNumber == field.fieldNumber-1){
                lineConsidered = field.fieldNumber;
                field.fieldNumber = prevFieldNumber;
                writeToFile();
                clear();
                field.fieldNumber = lineConsidered;
//                console.log("field.fieldNumber " + field.fieldNumber);
                getTitle(line,hyphen);
                getName(line,hyphen);
                field.previousField = "field";
                lineConsidered = 1;
            }else{
                field.fieldNumber = prevFieldNumber;
                previous = "";
            }
        }
    }
    var reg = /^[A-Z0-9 ]+=.*/;
    field.keywordFlag = checkKeyword(line);
    if(field.keywordFlag != false){
        getDescription(field.content);
        field.content = "";
        getKeyword(line);
    }else if(field.previousField != "field"  && previous === field.previousField){
        if(field.previousField != "valid entry" && field.previousField != "validEntryNotes"){
            field.content = field.content + " \n " + line;
        }else if(reg.exec(line) != null && field.previousField === "validEntryNotes"){
            if(line.indexOf("=") > -1){
                processValidEntry(line);
            }else{
                field.content = field.content + " \n " + line;
            }
        }else{
            field.content = field.content + "\n" + line;
        }
    }else if(field.previousField === "field" && lineConsidered != 1){
        getDefinition(line);
    }
}


/**
* Check for keyword in the line
*/
function checkKeyword(line){
    var re = /^(NOTE)s*/;
    if(line.indexOf("VALID ENTRIES") > -1 || line.indexOf("USAGE") > -1 || line.indexOf("DATA CHARACTERISTICS") > -1 || line.indexOf("EXAMPLE") > -1 || line.indexOf("EXAMPLES") > -1){
        return true;
    }else if(re.exec(line) != null){
        return true;
    }else{
        return false
    }
}


/**
* Return the version from the line
*/
function getVersion(line){
 var re = /[a-z A-Z]+(\-)\d+(\-)\d+/;
    if(re.exec(line) && line.indexOf("ATIS") > -1){
        var words = line.split(" ");
        field.asogVersion = words[0].substring(words[0].length-4, words[0].length);
    }
}


/**
* Store processing information (Date-time)
*/
function processedAt(){
    field.processed = new Date();
}


/**
* Retrieve title
*/
// TODO handle multiple hyphens
function getTitle(line,hyphen){
    var title = String(line.match(/([A-Z\-\–]+)-(.*)/));
    field.title = line.substring(line.indexOf(".")+1,line.indexOf(hyphen));
    field.title = field.title.trim();
    if(line.indexOf("(") > -1 && line.indexOf(")") > -1){
        field.title = field.title + " " +line.substring(line.indexOf("(")+1,line.indexOf(")"));
    }
}


/**
* Retrieve the name, which will be used for the file
*/
function getName(line,hyphen){
    field.name = String(line.match(/[-]*[–]*s*.*/));
    field.name = (field.name.split(hyphen))[1];
}


/**
* Retrieve definition info
*/
function getDefinition(line){
    field.definition = field.definition + " " + line;
}


/**
* Retrieve the keyword. The lines following will be the description for the keyword
*/
function getKeyword(line){
    var re = /^(NOTE)s*/;
    if(re.exec(line) != null){
        switch(field.previousField){
            case "field":
                field.previousField = "fieldNotes";
                break;
            case "valid entry":
                field.previousField = "validEntryNotes";
                break;
            case "usage":
                field.previousField = "usageNotes";
                break;
            case "example":
                field.previousField = "exampleNotes";
                break;
            default:
//                console.log("default");
        }
    }else if(line.indexOf("VALID ENTRIES") > -1){
        field.previousField = "valid entry";
    }else if (line.indexOf("USAGE") > -1){
        field.previousField = "usage";
    }else if (line.indexOf("DATA CHARACTERISTICS") > -1){
        field.previousField = "data";
    }else if((line.indexOf("EXAMPLE") > -1) || (line.indexOf("EXAMPLES") > -1)){
        field.previousField = "example";
    }
}


/**
* Retrieve description and store in the respective keywords in the field object
*/
function getDescription(line){
    var re = /^3-\d+$/;
    if(re.exec(line) === null && line != " "){
        line = line.trim();
        switch(field.previousField){
            case "fieldNotes":
                line = line.replace(/\n/g," ");
                field.fieldNotes.push(line);
                break;
            case "validEntryNotes":
                line = line.replace(/\n/g," ");
                field.validEntryNotes.push(line);
                break;
            case "usageNotes":
                line = line.replace(/\n/g," ");
                field.usageNotes.push(line);
                break;
            case "exampleNotes":
                line = line.replace(/\n/g," ");
                field.exampleNotes.push(line);
                break;
            case "valid entry":
                processValidEntry(line);
                break;
            case "data":
                line = line.replace(/\n/g," ");
                getLength(line);
                break;
            case "example":
/*             Example is removed as the format is not right */
//                var values = line.split("\n");
//                for(var tillValues = 0; tillValues < values.length;tillValues++){
//                    values[tillValues] = values[tillValues].replace(/\s/g,"");
//                    field.example = (field.example + " " + values[tillValues]).trim();
//                }
                break;
            case "usage":
                line = line.replace(/\n/g," ");
                line = line.trim();
                line = line.split(" ");
                switch(line[3]){
                    case "required.":
                        field.usage = "Required";
                        break;
                    case "conditional.":
                        field.usage = "Conditional";
                        break;
                    case "optional.":
                        field.usage = "Optional";
                        break;
                    default:
//                        console.log("default");
                }
                break;
            default:
//                console.log("Default case");
        }
    }
}


/**
* Retrieve valid entry information for the field
*/
function processValidEntry(line){
    line = line.trim();
    var entries = line.split("\n");
    for(var entryCounter = 0; entryCounter < entries.length; entryCounter++){
        field.validEntry[tillEntries] = {};
        if(entries[entryCounter].indexOf("=") > -1){
            field.validEntry[tillEntries].value = entries[entryCounter].split("=")[0].trim();
            field.validEntry[tillEntries].description = entries[entryCounter].split("=")[1].trim();
        }else{
            field.validEntry[tillEntries].value = "";
            field.validEntry[tillEntries].description = entries[entryCounter];
        }
        tillEntries++;
    }
}


/**
* Retrieve the minimum and maximum length for the field
*/
function getLength(line){
    line = line.trim();
    if((line.indexOf("maximum") > -1) && (line.indexOf("minimum") > -1)){
        var values = line.split("and");
        for(var i = 0; i<values.length;i++){
            getLengthValues(values[i]);
        }
    }else{
        field.minimumLength = "";
        getLengthValues(line);
    }
}


/**
* Retrieve the characteristics and length if only one data value is specified
*/
function getLengthValues(line){
    line = line.trim();
    var values = line.split(" ");
    if(line.indexOf("minimum") > -1){
        field.minimumLength = values[0];
    }else{
        field.maximumLength = values[0];
    }
    switch(values[1]){
        case "alpha":
            field.characteristics = "Alpha";
            break;
        case "numeric":
            field.characteristics = "Numeric";
            break;
        default:
            field.characteristics = "AlphaNumeric";
    }
}


/**
* Check if the line indicates the start of a new page
*/
function isNewPage(line){
    var re = /^3-\d+$/;
    if(re.exec(line) != null){
        return true;
    }
    return false;
}


/**
* Initialize and clear previous values stored
*/
function clear(){
    field.previousField = "";
    field.definition = "";
    field.example = "";
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
title = title.replace('/',':');
    if(field.fieldNumber != 0){
//        console.log(JSON.stringify(field, replacer, 4));
        outputFileName =  field.form + "/" + title + ".json";
        fs.writeFile(outputFileName, JSON.stringify(field, replacer, 4), function(err) {
        if (err) {
            return console.log(err);
        }
        })
    }
}


/**
* Replace the keys that should not be displayed/written to a file
* example is removed as the format is not right
*/
function replacer(key, value) {
    if ( key=="keywordFlag" || key=="previousField" || key=="content" || key == "example") {
        return undefined;
    }
    return value;
}