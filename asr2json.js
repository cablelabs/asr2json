var fs = require('fs');
var ofs = require('fs');
var field = {};
field.breakString = [ "NOTE", "VALID ENTRIES", "USAGE", "DATA CHARACTERISTICS", "EXAMPLE", "EXAMPLES" ];
field.breakValue = "EXAMPLE";

fs.readFile('asrpdf.json', 'utf8', function(err, data) {
    if (err) {
        throw err;
    }
    json = JSON.parse(data);

    var flag = 0;
    var sectionFlag = 0;
    field.fieldNumber = 0;
    for( field.i = 0; field.i<json.formImage["Pages"].length; field.i++) {
//    for( field.i = 0; field.i<4; field.i++) { // For each page
        texts = json.formImage["Pages"][field.i]["Texts"];
        for( field.j = 0; field.j<texts.length; field.j++) {  // For text in the page
            R = texts[field.j]["R"];
            for( field.k = 0; field.k<R.length; field.k++) {  // For each line
                T = R[field.k]["T"];
                TS = R[field.k]["TS"][2];

                // STORING FORM NAME
                if ( T == "3." && TS == "1" && texts[field.j+1]["R"][field.k]["T"].indexOf("FORM")>-1) {
                    R = texts[++field.j]["R"];
                    T = R[field.k]["T"];
                    var checkIfForm = T.split("FORM");
                    if ( checkIfForm.length>1 ) {
                        var formName = T.split("(");
                        var formName = formName[1].split(")");
                        console.log(formName[0]);
                        flag = 0;
                        continue;
                    }
                    else {
                        console.log("T= " + T);
                    }
                }

                // STORING SECTION NAME
                var sectionNumber = T.split(".");
                if ( sectionFlag == 1 ) {
                    var section = T.split("%20");
                    if (section.length > 1 ) {
                        if ( section[1] == "SECTION") {
                            console.log("Section= " + section.join(" "));
                            continue;
                        }
                    }
                    sectionFlag = 0;
                }
                else if ( !isNaN(sectionNumber[0]) && !isNaN(sectionNumber[1]) && sectionNumber[1].length>0 && TS == "1") {
                    sectionFlag = 1;
                    continue;
                }

                // STORING FIELD DETAILS

                var currentFieldNumber = T.split(".");
                if(isNaN(currentFieldNumber[0])) {
                    continue;
                }
                else {
                        var prevFieldNumber = field.fieldNumber;
                        if ( prevFieldNumber!=0 && field.fieldNumber!=currentFieldNumber[0] ) {
                            console.log("\nWriting Output");
                            writeOutput(prevFieldNumber, formName[0], field);
                            cleanFieldProperties();
                            field.fieldNumber = currentFieldNumber[0];
                        }
                        else {
                            field.fieldNumber = currentFieldNumber[0];
                        }

                        console.log("\nField Number= " + field.fieldNumber);

                        // Title
                        texts = json.formImage["Pages"][field.i]["Texts"];
                        R = texts[++field.j]["R"];
                        field.title = R[0]["T"].split("%20");
                        field.title = field.title[0];
                        console.log("Title= " + field.title);

                        // Name
                        texts = json.formImage["Pages"][field.i]["Texts"];
                        R = texts[++field.j]["R"];
                        field.name = R[field.k]["T"].split("%20");
                        field.name = field.name.join(" ");
                        console.log("Name= " + field.name);

                        // Definition
                        texts = json.formImage["Pages"][field.i]["Texts"];
                        R = texts[++field.j]["R"];
                        field.definition = getFieldInfo(R, texts, json);
                        field.definition = filter(field.definition);
                        console.log("Definition= " + field.definition);

                    do {
                        // Field Notes
                        if ( field.breakValue == "FIELD NOTES") {
                            texts = json.formImage["Pages"][field.i]["Texts"];
                            R = texts[++field.j]["R"];
                            field.fieldNotes = getFieldInfo(R, texts, json);
                            field.fieldNotes = filter(field.fieldNotes);
                            console.log("\nField Notes= " + field.fieldNotes);
                            field.fieldNotes = field.fieldNotes.split("\n");
                        }

                        // Valid Entries
                        if ( field.breakValue == "VALID ENTRIES") {
                            texts = json.formImage["Pages"][field.i]["Texts"];
                            R = texts[++field.j]["R"];
                            if ( 'validEntries' in field ) {
                                field.validEntries = field.validEntries + "\n" + getFieldInfo(R, texts, json);
                            }
                            else {
                                field.validEntries = getFieldInfo(R, texts, json);
                            }
                            field.validEntries = validEntriesFilter(field.validEntries);
                            field.validEntries = field.validEntries.split("\n");
                            console.log("\nvalidEntries= " + field.validEntries);
                        }

                        // Valid Entry Notes
                        if ( field.breakValue == "VALID ENTRY NOTES") {
                            texts = json.formImage["Pages"][field.i]["Texts"];
                            R = texts[++field.j]["R"];
                            field.validEntryNotes = getFieldInfo(R, texts, json);
                            field.validEntryNotes = filter(field.validEntryNotes);
                            console.log("\nvalidEntryNotes= " + field.validEntryNotes);
                        }

                        // Usage
                        if ( field.breakValue == "USAGE") {
                            texts = json.formImage["Pages"][field.i]["Texts"];
                            R = texts[++field.j]["R"];
                            field.usage = getFieldInfo(R, texts, json);
                            field.usage = filter(field.usage);
                            if (field.usage.indexOf("required") > -1 ) {
                                field.usage = "Required";
                                console.log("\nusage= Required");
                            }
                            else if ( field.usage.indexOf("conditional") > -1 ) {
                                field.usage = "Conditional";
                                console.log("\nusage= Conditional");
                            }
                        }


                        // Usage Notes
                        if ( field.breakValue == "USAGE NOTES") {
                            texts = json.formImage["Pages"][field.i]["Texts"];
                            R = texts[++field.j]["R"];
                            field.usageNotes = getFieldInfo(R, texts, json);
                            field.usageNotes = filter(field.usageNotes);
                            console.log("\nusageNotes= " + field.usageNotes);
                        }

                        console.log("Text before data char= " + R[0]["T"]);
                        console.log("Break Value= " + field.breakValue);
                        // Data Characteristics
                        if ( field.breakValue == "DATA CHARACTERISTICS") {
                            texts = json.formImage["Pages"][field.i]["Texts"];
                            R = texts[++field.j]["R"];
                            field.dataCharacteristics = getFieldInfo(R, texts, json);
                            field.dataCharacteristics = field.dataCharacteristics.split("\n");
                            field.dataCharacteristics = field.dataCharacteristics.join("");
                            field.dataCharacteristics = field.dataCharacteristics.split("%20");
                            console.log("fieldLength = " + field.dataCharacteristics[0]);
                            field.fieldLength = field.dataCharacteristics[0];
                            var characteristics = "";
                            if ( field.dataCharacteristics[1].indexOf("alpha") > -1 && field.dataCharacteristics[1].indexOf("numeric") > -1) {
                                characteristics = "Alphanumeric";
                            }
                            else if ( field.dataCharacteristics[1].indexOf("alpha") > -1 ) {
                               characteristics = "Alpha";
                            }
                            else if ( field.dataCharacteristics[1].indexOf("numeric") > -1) {
                                characteristics = "Numeric";
                            }
                            field.dataCharacteristics = characteristics;
                        }

                        // EXAMPLE OR EXAMPLES
                        if ( field.breakValue == "EXAMPLE" || field.breakValue == "EXAMPLES") {
                            texts = json.formImage["Pages"][field.i]["Texts"];
                            R = texts[++field.j]["R"];
                            field.examples = getFieldInfo(R, texts, json);
                            console.log("examples = " + field.examples);
                            field.j = texts.length;
                            break;
                        }
                    } while ( field.breakValue!="EXAMPLE" && field.breakValue!="EXAMPLES" );
                }
            }
        }
    }
});

function getFieldInfo(R, texts, json) {
    console.log("Text= " + R[0]["T"]);

    var line = R[field.k]["T"].split("%20");
    var fieldInfo = "";
    var fieldFlag = 0;
    while (true) {
        fieldInfo = fieldInfo + "\n" + R[field.k]["T"];
        // Move to next page if last line
        if ( field.j + 1 == texts.length ) {
            field.i++;
            texts = json.formImage["Pages"][field.i]["Texts"];
            var checkField = texts[5]["R"][0]["T"].split(".");

            if ( checkField[0] == field.fieldNumber ) {
                field.j = 6;
            }
            else {
                break;
            }
        }
        R = texts[++field.j]["R"];
        line = R[field.k]["T"].split("%20");
        line = line.join(" ");

        for ( var index=0; index<field.breakString.length; index++ ) {
            if ( line.indexOf( field.breakString[index] ) > -1 ) {
                if ( field.breakString[index]=="NOTE" ) {
                    if ( field.breakValue == "FIELD NOTES" || field.breakValue == "VALID ENTRY NOTES" || field.breakValue == "USAGE NOTES" ) {
                        break;
                    }
                    else if ( field.breakValue == "EXAMPLE" || field.breakValue == "EXAMPLES" ) {
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
                    field.breakValue = field.breakString[index];
                }
                fieldFlag = 1;
                break;
            }
        }
        if ( fieldFlag == 1 ) {
            break;
        }
    }
    return(fieldInfo);
}

function filter(definition) {
    var splitValues = [ "T\n", "\n", "%20", " b y ", " o f ", " w ithin ", " NOTE ", "%2C", "%E2%80%9C", "%E2%80%9D", "%E2%80%99", "%2F", "1%3A ", "2%3A ", "3%3A ", "4%3A ", "5%3A ", "6%3A ", "7%3A " ];
    var joinValues = [ "T", " ", " ", " by ", " of ", " within ", "", ",", "\"", "\"", "\'", "/", "\n", "\n", "\n", "\n", "\n", "\n", "\n" ];
    for( var index = 0; index < splitValues.length; index++ ) {
        definition = definition.split(splitValues[index]);
        definition = definition.join(joinValues[index]);
    }
    return definition;
}

function validEntriesFilter(definition) {
    var splitValues = [ "%20", "%2F", "%3D", "= \n", "\n" ];
    var joinValues = [ " ", "/", "=", "= ", " " ];
    for( var index = 0; index < splitValues.length; index++ ) {
        definition = definition.split(splitValues[index]);
        definition = definition.join(joinValues[index]);
    }
    return definition;
}

function writeOutput(prevFieldNumber, formName, field) {
    var dir = "./" + formName;
    if (!ofs.existsSync(dir)) {
        ofs.mkdirSync(dir);
    }
    outputFileName =  formName + "/" + field.title + ".json";
    ofs.writeFile(outputFileName, JSON.stringify(field, replacer, 4), function(err) {
        if (err) {
            return console.log(err);
        }
    })
}

function replacer(key, value) {
    if ( key=="i" || key=="j" || key=="k" || key=="breakString" || key=="breakValue" ) {
        return undefined;
    }
    return value;
}
function cleanFieldProperties() {
    for ( var key in field ) {
//        console.log("key= " + key);
        if ( key!="i" && key!="j" && key!="k" && key!="breakString" && key!="breakValue" ) {
//            console.log("Key deleted= " + key);
            delete field[key];
        }
    }
}