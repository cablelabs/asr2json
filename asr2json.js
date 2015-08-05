var fs = require('fs');
//var jsonConsolidator = require("./jsonConsolidator");
//var r = new jsonConsolidator();
var formNumber = "3";
var field = {"asogVersion": "", "processed": "", "form": "", "section": "", "name": "", "title": "", "fieldNumber": "", "fieldLength": "", "characteristics": "", "usage": "", "example": "", "definition": "", "validEntry": "", "validEntryNotes": "", "usageNotes": "", "fieldNotes": ""};

field.breakValue = "EXAMPLE";
field.asogVersion = "50";
field.processed = new Date();
var line = "";

var contents = fs.readFileSync('textalone', 'utf8').toString().split("\n");
var i=0;
for ( i=0; i < contents.length; i++) {
//for ( i=0; i < 23; i++) {
    line = contents[i];

    // CHECK IF FORM
    var regex = new RegExp("^" + formNumber + "\.[^0-9]");
    if ( regex.exec(line) && line.indexOf("FORM")>-1) {
        getForm();
    }

    // CHECK IF SECTION
    regex = /^3\.[0-9]/;
    if ( regex.exec(line) && line.indexOf("SECTION")>-1) {
        getSection();
    }

    // CHECK IF FIELD
    line = line.trim() + "\n";
    regex = /^[0-9]+\./;
    if ( regex.exec(line) && (line.indexOf("-")>-1 || line.indexOf("–")>-1)) {
        getField(line);
    }
    if ( i>=contents.length ) {
//        console.log("contents.length = " + contents.length );
//        console.log("i= " + i);
    }
}

function getForm() {
    field.form = line.split("(");
    field.form = (field.form[1].split(")"))[0];
//    console.log("FORM= " + field.form);
}

function getSection() {
    field.section = String(line.match(/[a-zA-Z ]+$/));
    field.section = (field.section.split(" SECTION"))[0];
//    console.log("Section= " + field.section);
}

function getField(line) {
    var currentFieldNumber = line.split(".")[0];
    var prevFieldNumber = field.fieldNumber;

    if ( prevFieldNumber!=0 && prevFieldNumber!=currentFieldNumber ) { // END OF FIELD
        filterDefinitions();
        writeOutput(prevFieldNumber);
        cleanFieldProperties();
        field.fieldNumber = currentFieldNumber;
    }

    if( line.indexOf("continued") == -1) {
        field.fieldNumber = currentFieldNumber;
        // TITLE AND NAME
        if ( line.split("-").length == 2 || line.split("–").length == 2) {
            var re1 = new RegExp( "[0-9]+\.(.*)[\-\–](.*)", "g" );
            var result = re1.exec(line);
            field.title = result[1].trim();
            field.name = result[2].trim();
        }
        else if ( line.match(/^[0-9]+\.[A-Z]+[\-\–]/)) {
            var re1 = new RegExp( "[0-9]+\.([A-Z\-\–]+)([A-Z][a-z].*)", "g" );
            var result1 = re1.exec(line);
            field.title = result1[1].replace(/[\-\–]$/,"").trim();
            field.name = result1[2].trim();
        }
        else {
            var re1 = new RegExp( "[0-9]+\.([ A-Z/\-\–]+?)[\-\–][ ]([A-Z][a-z].*)", "g" );
            var result = re1.exec(line);
            field.title = result[1].trim();
            field.name = result[2].trim();
        }
//        console.log("Title= " + field.title);
//        console.log("Name= " + field.name);
        field.breakValue = "DEFINITION";
    }
    else {
        line = contents[++i].trim() + "\n";
        checkKeyWord(line);
    }

    var pageNumberRegex = /^3-[0-9]+$/;
    while ( i+1 != contents.length && !pageNumberRegex.exec(contents[i+1]) ) {
        switch(field.breakValue) {
            case "DEFINITION":
                field.definition = getFieldInfo().replace(/\n/g," ").trim();
//                console.log("DEFINITION= " + field.definition);
                break;
            case "FIELD NOTES":
                field.fieldNotes = field.fieldNotes + getFieldInfo().trimRight();
//                console.log("FIELD NOTES= " + field.fieldNotes);
                break;
            case "VALID ENTRIES":
                field.validEntry = field.validEntry + getFieldInfo();
//                console.log("VALID ENTRIES= " + field.validEntry);
                break;
            case "VALID ENTRY NOTES":
                field.validEntryNotes = field.validEntryNotes + getFieldInfo();
//                console.log("VALID ENTRY NOTES= " + field.validEntryNotes);
                break;
            case "USAGE":
                field.usage = getFieldInfo().trim();
                field.usage = (field.usage.indexOf("required") > -1)? "Required" : ((field.usage.indexOf("conditional") > -1)? "Conditional" : "Optional");
//                console.log("USAGE= " + field.usage);
                break;
            case "USAGE NOTES":
                field.usageNotes = field.usageNotes + getFieldInfo().trim();
//                console.log("USAGE NOTES= " + field.usageNotes);
                break;
            case "DATA CHARACTERISTICS":
                var info = (getFieldInfo().trim()).split(" ");
                field.fieldLength = info[0];
                field.characteristics = (info[1].indexOf("alpha") > -1) ? ((info[1].indexOf("numeric") > -1) ? "AlphaNumeric" : "Alpha" ) : "Numeric";
//                console.log("Characteristics= " + field.characteristics);
                break;
            case "EXAMPLE" || "EXAMPLES":
                field.example = getFieldInfo().trim();
//                console.log("EXAMPLE= " + field.example);
                break;
        }
    }
}

function getFieldInfo() {
    var pageNumberRegex = /^3-[0-9]+$/;
    var fieldInfo = "";
    if ( field.breakValue == "FIELD NOTES" || field.breakValue == "VALID ENTRY NOTES" || field.breakValue == "USAGE NOTES" ) {
        fieldInfo = " " + contents[i].trim() + "\n";
    }
    while ( i+1 != contents.length && !pageNumberRegex.exec(contents[i+1])) {
        line = contents[++i].trim() + "\n";

        // Check if keyword is present
        if( checkKeyWord(line) == 1 ) {
            return fieldInfo;
        }

        // Checking if valid entries are present after valid entry notes
        var validEntriesRegex = /^[A-Z0-9 ]+=.*/;
        if ( line.match(validEntriesRegex) && field.breakValue == "VALID ENTRY NOTES" ) {
            i--;
            field.breakValue = "VALID ENTRIES";
            return fieldInfo;
        }

        if ( fieldInfo == "" ) {
            fieldInfo = line;
        }
        else {
            fieldInfo = fieldInfo + line;
        }
    }
    return fieldInfo;
}

function checkKeyWord(line) {
    var keyWords = [ "NOTE", "VALID ENTRIES", "USAGE", "DATA CHARACTERISTICS", "EXAMPLE", "EXAMPLES" ];
    for ( var index=0; index<keyWords.length; index++ ) {
        if ( line.indexOf( keyWords[index] ) > -1 ) {
            if ( keyWords[index]=="NOTE" ) {
                if ( field.breakValue == "FIELD NOTES" || field.breakValue == "VALID ENTRY NOTES" || field.breakValue == "USAGE NOTES" ) {
                    break;
                }
                else if ( field.breakValue == "DEFINITION" ) {
                    field.breakValue = "FIELD NOTES";
                }
                else if ( field.breakValue == "VALID ENTRIES" ) {
                    field.breakValue = "VALID ENTRY NOTES";
                }
                else if ( field.breakValue == "USAGE" ) {
                    field.breakValue = "USAGE NOTES";
                }
            }
            else {
                field.breakValue = keyWords[index];
            }
            return 1;
        }
    }
    return 0;
}

function filterDefinitions() {
    field.usageNotes = field.usageNotes.replace("NOTE 1:\n","").replace(/\n/g," ").split(/ NOTE [0-9]: /);
    field.example = field.example.replace(/ /g,"").split("\n");
    field.fieldNotes = field.fieldNotes.replace(" NOTE 1:\n","").replace(/\n/g," ").split(/ NOTE [0-9]+: /);
    field.validEntryNotes = field.validEntryNotes.replace(/^ NOTE 1:\n/,"").replace(/\n/g," ").split(/ NOTE [0-9]+: /);

    field.validEntry = field.validEntry.trim();
    if ( field.validEntry.indexOf("=") == -1 && field.validEntry.indexOf("\n") > -1) { // FOR VALID ENTRIES IN TABLE FORMAT
        field.validEntry = field.validEntry.split("\n");
    }
    else {
        var validEntries = field.validEntry;
        if ( validEntries.length == 0 ) { // NO VALID ENTRIES PRESENT
            field.validEntry = [];
            return;
        }

        field.validEntry = [];
        validEntries = validEntries.split("\n");
        for( var index=0; index<validEntries.length; index++ ) {
            field.validEntry[index] = {};
            if ( validEntries[index].indexOf("=") == -1 ) {
                field.validEntry[index].value = "";
                field.validEntry[index].description = validEntries[index];
            }
            else {
                field.validEntry[index].value = validEntries[index].split("=")[0].trim();
                field.validEntry[index].description = validEntries[index].split("=")[1].trim();
            }
        }
    }
}

function writeOutput(prevFieldNumber) {
    var dir = "./" + field.form;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    outputFileName =  field.form + "/" + field.title.replace("/","") + ".json";

//    console.log("outputFileName = " + outputFileName);
//    if (fs.existsSync(outputFileName)) {
//        console.log('Found file');
////        outputFileName =  field.form + "/" + (field.name.replace(" ", "")).replace("/","") + ".json";
//    }

    fs.writeFile(outputFileName, JSON.stringify(field, replacer, 4), function(err) {
        if (err) {
            return console.log(err);
        }
    })
//    console.log("");
}

function replacer(key, value) {
    if ( key=="breakValue") {
        return undefined;
    }
    return value;
}

function cleanFieldProperties() {
    for ( var key in field ) {
        if ( key!="breakValue" && key!="asogVersion" && key!="processed" && key!="form" && key!="section") {
            delete field[key];
            field[key] = "";
        }
    }
}