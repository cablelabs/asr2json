var fs = require('fs');
var exec = require('child_process').exec;
var jsonConsolidator = require("./jsonConsolidator");

var arguments = process.argv.slice(2);
var fileName = arguments[0];
var startPage = arguments[1];
var endPage = arguments[2];

// SPLITTING THE PDF
var child = exec("python pdfsplit.py " + fileName + " " + startPage + " " + endPage, function (error, stdout, stderr) {
    if (error !== null) {
         console.log('exec error: ' + error);
    }
    else {
        // CONVERTING THE PDF TO JSON
        child = exec("pdf2json -f " + fileName.split("/")[1].split(".pdf")[0] + "." + startPage + "_" + endPage + ".pdf -s", {maxBuffer: 1024 * 500}, function (error, stdout, stderr) {
            if (error !== null) {
               console.log('exec error: ' + error);
            }
            else {
                jsonConsolidator.jsonConsol(fileName.split("/")[1].split(".pdf")[0] + "." + startPage + "_" + endPage + ".json");
                parse();
            }
        });
    }
});

// INITIALIZING VARIABLES
var hashMap = {};
var formNumber = "3";
var field = {"asogVersion": "", "processed": "", "form": "", "section": "", "name": "", "title": "", "fieldNumber": "", "minimumLength": "", "maximumLength": "", "characteristics": "", "usage": "", "example": "", "definition": "", "validEntry": "", "validEntryNotes": "", "usageNotes": "", "fieldNotes": "", "exampleNotes": ""};
field.breakValue = "EXAMPLE";
field.asogVersion = "50";
field.nextSection = "";
field.processed = new Date();
var line = "";
var i=0;
var contents ="";

function parse() {
    fs.readFile("textalone", "utf8", function (error, contents) {
        if(error){
            console.log(error);
        }
        contents = contents.toString().split("\n");

        // HASH MAP TO FIND FIELDS HAVING SAME FIELD TITLE
        for ( i=0; i < contents.length; i++) {
            line = contents[i];
            var regex = /^[0-9]+\./;
            if ( regex.exec(line) && (line.indexOf("-")>-1 || line.indexOf("–")>-1) && line.indexOf("continued") == -1 && contents[i+1].indexOf("continued") == -1) {
                if ( getFieldNameandTitle(line) == 0 ) {
                    continue;
                }
                if( hashMap[field.title.trim()] == undefined ) {
                    hashMap[field.title.trim()] = 1;
                }
                else {
//                    console.log(line);
                    hashMap[field.title.trim()] = hashMap[field.title.trim()] + 1;
                }
            }
        }
//        console.log(hashMap);
        clearFieldProperties();

        // READING CONTENTS LINE BY LINE
        for ( i=0; i < contents.length; i++) {
            line = contents[i];

            checkIfForm();

            checkIfSection();

            // CHECK IF FIELD
            line = line.trim() + "\n";
            regex = /^[0-9]+\./;
            if ( regex.exec(line) && (line.indexOf("-")>-1 || line.indexOf("–")>-1)) {
                getField(line);
            }
        }

        function checkIfForm() {
            var regex = new RegExp("^" + formNumber + "\.[^0-9]");
            if ( regex.exec(line) && line.indexOf("FORM")>-1) {
//                field.nextForm = (field.nextForm == "") ? (line.split("(")[1]).split(")")[0] : field.form;
//                field.form = (line.split("(")[1]).split(")")[0];
                field.form = (line.split("(")[1]).split(")")[0].replace("/","");
            }
        }

        function checkIfSection() {
            var regex = /^3\.[0-9]/;
            if ( regex.exec(line) && line.indexOf("SECTION")>-1) {
//                field.prevSection = (field.prevSection == "") ? String(line.match(/[a-zA-Z ]+$/)).split(" SECTION")[0] : field.section;
//                field.section = String(line.match(/[a-zA-Z ]+$/));
//                field.section = (field.section.split(" SECTION"))[0];
                field.nextSection = String(line.match(/[a-zA-Z ]+$/)).split(" SECTION")[0];
            }
        }

        function getField(line) {
            var currentFieldNumber = line.split(".")[0];
            var prevFieldNumber = field.fieldNumber;

//            console.log("\nLine= " + line);
//            console.log("prevFieldnum= " + prevFieldNumber);
//            console.log("currentFieldnum= " + currentFieldNumber);


            // CHECKING END OF FIELD
            if ( prevFieldNumber!=0 && prevFieldNumber!=currentFieldNumber ) {
                if( field.form == "") {
//                    field.form = field.nextForm;
                    field.section = field.nextSection;
                }
                filterDefinitions();
                writeOutput(prevFieldNumber);
                clearFieldProperties();
                field.fieldNumber = currentFieldNumber;
//                field.form = field.nextForm;
                field.section = field.nextSection;
            }

            if( line.indexOf("continued") == -1) { // FOR NEW FIELD
                field.fieldNumber = currentFieldNumber;

                // TITLE AND NAME
                getFieldNameandTitle(line);
                field.breakValue = "DEFINITION";
            }
            else { // FOR CONTINUED FIELD
                line = contents[++i].trim() + "\n";
                checkKeyWord(line);
            }

            var pageNumberRegex = /^3[\-\-][0-9]+$/;
            while ( i+1 != contents.length && !pageNumberRegex.exec(contents[i+1].trim()) ) {
                switch(field.breakValue) {
                    case "DEFINITION":
                        field.definition = getFieldInfo().replace(/\n/g," ").trim();
                        break;
                    case "FIELD NOTES":
                        field.fieldNotes = field.fieldNotes + getFieldInfo().trimRight();
                        break;
                    case "VALID ENTRIES":
                        field.validEntry = field.validEntry + getFieldInfo();
                        break;
                    case "VALID ENTRY NOTES":
                        field.validEntryNotes = field.validEntryNotes + getFieldInfo();
                        break;
                    case "USAGE":
                        field.usage = getFieldInfo().trim();
                        field.usage = (field.usage.indexOf("required") > -1)? "Required" : ((field.usage.indexOf("conditional") > -1)? "Conditional" : "Optional");
                        break;
                    case "USAGE NOTES":
                        field.usageNotes = field.usageNotes + getFieldInfo().trim();
                        break;
                    case "DATA CHARACTERISTICS":
                        var info = (getFieldInfo().trim());
                        if ( info.indexOf("minimum") == -1 ) {
                            field.maximumLength = info.trim().split(" ")[0];
                        }
                        else {
                            var re1 = new RegExp( "([0-9])+[^0-9]+([0-9])+", "g" );
                            var result = re1.exec(info);
                            field.minimumLength = result[1].trim();
                            field.maximumLength = result[2].trim();

//                            field.minimumLength = info.split("and")[0].trim().split(" ")[0].trim();
//                            field.maximumLength = info.split("and")[1].trim().split(" ")[0].trim();
                        }
//                        console.log("info= " + info);
                        field.characteristics = (info.split(" ")[1].indexOf("alpha") > -1) ? ((info.split(" ")[1].indexOf("numeric") > -1) ? "AlphaNumeric" : "Alpha" ) : "Numeric";
                        break;
                    case "EXAMPLE" || "EXAMPLES":
                        field.example = field.example + getFieldInfo().trim();
                        break;
                    case "EXAMPLE NOTES":
                        field.exampleNotes = field.exampleNotes + getFieldInfo().trim();
                        break;
                }
            }
            if ( i+1 >= contents.length ) { // OUTPUT FOR LAST FIELD
                filterDefinitions();
                writeOutput(field.fieldNumber);
            }
        }

        function getFieldNameandTitle(line) {
            if ( line.split("-").length == 2 || line.split("–").length == 2) { // Condition when there is only one hyphen
                var re1 = new RegExp( "[0-9]+\.(.*)[\-\–](.*)", "g" );
                var result = re1.exec(line);
                field.title = result[1].trim();
                field.name = result[2].trim();
            }
            else if ( line.match(/^[0-9]+\.[A-Z\-\–]+[ ][\-\–][ ]/)) { // Condition when there are no spaces in title, name line (E.g. 85.FUSF-Federal...)
                var re1 = new RegExp( "[0-9]+\.([A-Z\-\–]+)[ ][\-\–][ ]([A-Z][a-z].*)", "g" );
//                console.log("CASE 2= " + line);
                var result1 = re1.exec(line);
                field.title = result1[1].replace(/[\-\–]$/,"").trim();
                field.name = result1[2].trim();

            }
            else if ( line.match(/^[0-9]+\.[A-Z]+[\-\–]/)) { // Condition when there are no spaces in title, name line (E.g. 85.ASC-EC-...)
                var re1 = new RegExp( "[0-9]+\.([A-Z\-\–]+)([A-Z][a-z].*)", "g" );
//                console.log("CASE 3= " + line);
                var result1 = re1.exec(line);
                field.title = result1[1].replace(/[\-\–]$/,"").trim();
                field.name = result1[2].trim();

            }
            else if ( line.match(/[0-9]+\.([ A-Z/\-\–]+?)[\-\–][ ]([A-Z][a-z].*)/)) {
                var re1 = new RegExp( "[0-9]+\.([ A-Z/\-\–]+?)[\-\–][ ]([A-Z][a-z].*)", "g" ); // Condition when there are spaces in title, name line (E.g. 1. CCNA - Customer...)
//                console.log("CASE 4= " + line);
                var result = re1.exec(line);
                field.title = result[1].trim();
                field.name = result[2].trim();
            }
            else {
                return 0;
            }
        }

        function getFieldInfo() {
            var pageNumberRegex = /^3[\-\-][0-9]+$/;
            var fieldInfo = "";
            // Added condition to include the word "NOTE" in the notes
            if ( field.breakValue == "FIELD NOTES" || field.breakValue == "VALID ENTRY NOTES" || field.breakValue == "USAGE NOTES" || field.breakValue == "EXAMPLE NOTES" ) {
                fieldInfo = " " + contents[i].trim() + "\n";
            }
            while ( i+1 != contents.length && !pageNumberRegex.exec(contents[i+1].trim())) {
//                console.log(contents[i+1]);
                line = contents[++i].trim() + "\n";
//                console.log("Line= " + line);
                // Check if keyword is present
                if( checkKeyWord(line) == 1 ) {
                    return fieldInfo;
                }

                // Checking if valid entries are present after valid entry notes
                var validEntriesRegex = /^[A-Z0-9\- ]+=.*/;
                if ( line.match(validEntriesRegex) && field.breakValue == "VALID ENTRY NOTES" ) {
                    i--;
                    field.breakValue = "VALID ENTRIES";
                    return fieldInfo;
                }

                // Store Field Information
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
                        if ( field.breakValue == "FIELD NOTES" || field.breakValue == "VALID ENTRY NOTES" || field.breakValue == "USAGE NOTES" || field.breakValue == "EXAMPLE NOTES" ) {
                            break;
                        }
                        else if ( field.breakValue == "DEFINITION" ) {
                            field.breakValue = "FIELD NOTES";
                        }
                        else if ( field.breakValue == "DATA CHARACTERISTICS" ) {
//                            console.log("DATA CHAR" + line);
                            field.breakValue = "FIELD NOTES";
                        }
                        else if ( field.breakValue == "VALID ENTRIES" ) {
                            field.breakValue = "VALID ENTRY NOTES";
                        }
                        else if ( field.breakValue == "USAGE" ) {
                            field.breakValue = "USAGE NOTES";
                        }
                        else if ( field.breakValue == "EXAMPLE" || field.breakValue == "EXAMPLES") {
                            field.breakValue = "EXAMPLE NOTES";
                        }
                    }
                    else {
                        field.breakValue = keyWords[index];
                    }
//                    console.log(field.breakValue);
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
            field.exampleNotes = field.exampleNotes.replace(/^NOTE 1:\n/,"").replace(/\n/g," ").split(/ NOTE [0-9]+: /);

            field.validEntry = field.validEntry.trim();
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

        function writeOutput(prevFieldNumber) {
//            console.log("Field.form= " + field.form);
            var dir = "./" + field.form;

            // CREATE NEW DIRECTORY IF IT DOES NOT EXIST
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            // CHECKING IF FIELD HAS DUPLICATE TITLE
            if(hashMap[field.title] > 1) {
//                console.log(field.title);
                outputFileName = field.form + "/" + field.title.replace("/","") + " " + field.name.split("(")[1].split(")")[0] + ".json";
            }
            else {
                outputFileName =  field.form + "/" + field.title.replace("/","") + ".json";
            }

            // WRITE OUTPUT TO FILE
            fs.writeFile(outputFileName, JSON.stringify(field, replacer, 4), function(err) {
                if (err) {
                    return console.log(err);
                }
            });
        }

        function replacer(key, value) {
            if ( key=="breakValue" || key=="nextSection" || key=="nextForm") {
                return undefined;
            }
            else if ( key=="example" ) {
                return "";
            }
            return value;
        }

        function clearFieldProperties() {
            for ( var key in field ) {
                if ( key!="breakValue" && key!="asogVersion" && key!="processed" && key!="form" && key!="section" && key!="nextForm" && key!="nextSection") {
                    delete field[key];
                    field[key] = "";
                }
            }
        }
    });
}