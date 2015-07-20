var fs = require('fs');
var ofs = require('fs');
var field = {};

fs.readFile('asrpdf.json', 'utf8', function(err, data) {
    if (err) {
        throw err;
    }
    json = JSON.parse(data);

    var flag = 0;
    var sectionFlag = 0;
    var fieldNumber = 0;
    var jsonOutput = {};
    for( field.i = 0; field.i<json.formImage["Pages"].length; field.i++) {
//    for( field.i = 0; field.i<4; field.i++) { // For each page
        texts = json.formImage["Pages"][field.i]["Texts"];
        for( field.j = 0; field.j<texts.length; field.j++) {  // For text in the page
            R = texts[field.j]["R"];
            for( field.k = 0; field.k<R.length; field.k++) {  // For each line
                T = R[field.k]["T"];
                TS = R[field.k]["TS"][2];

                console.log("T= " + T);

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

                var fieldNumber = T.split(".");
                if(isNaN(fieldNumber[0])) {
                    continue;
                }
                else {
                    var prevFieldNumber = fieldNumber;
                    if ( prevFieldNumber!=0 && prevFieldNumber!=fieldNumber[0] ) {
//                        writeOutput(prevFieldNumber, );
                        outputFileName = jsonOutput.title + ".json";
                        ofs.writeFile(outputFileName, JSON.stringify(jsonOutput, null, 4), function(err) {
                            if (err) {
                                return console.log(err);
                            }
                        })
                    }

                    console.log("\nField Number= " + fieldNumber[0]);
                    jsonOutput.fieldNumber = fieldNumber[0];

                    // Title
                    texts = json.formImage["Pages"][field.i]["Texts"];
                    R = texts[++field.j]["R"];
                    var title = R[0]["T"];
                    title = title.split("%20");
                    console.log("Title= " + title[0]);
                    jsonOutput.title = title[0];

                    // Name
                    texts = json.formImage["Pages"][field.i]["Texts"];
                    R = texts[++field.j]["R"];
                    var name = R[field.k]["T"];
                    name = name.split("%20");
                    console.log("Name= " + name.join(" "));
                    jsonOutput.name = name.join(" ");

                    // Definition
                    texts = json.formImage["Pages"][field.i]["Texts"];
                    R = texts[++field.j]["R"];
                    field.breakString = [ "NOTE", "VALID ENTRIES", "USAGE", "DATA CHARACTERISTICS", "EXAMPLE", "EXAMPLES" ];
                    field.breakValue = "";
                    var returnValue = getFieldInfo(R, texts, json, fieldNumber[0]);
                    var definition = returnValue;
                    definition = filter(definition);
                    console.log("Definition= " + definition);
                    jsonOutput.definition = definition;

                    // Field Notes
                    if ( field.breakValue == "NOTE") {
                        texts = json.formImage["Pages"][field.i]["Texts"];
                        R = texts[++field.j]["R"];
                        field.breakString = [ "VALID ENTRIES", "USAGE", "DATA CHARACTERISTICS", "EXAMPLE", "EXAMPLES" ];
                        returnValue = getFieldInfo(R, texts, json, fieldNumber[0]);
                        var fieldNotes = returnValue;
                        fieldNotes = filter(fieldNotes);
                        console.log("\nField Notes= " + fieldNotes);
                        fieldNotes = fieldNotes.split("\n");
                        jsonOutput.fieldNotes = fieldNotes;
                    }

                    // Valid Entries
                    if ( field.breakValue == "VALID ENTRIES") {
                        texts = json.formImage["Pages"][field.i]["Texts"];
                        R = texts[++field.j]["R"];
                        field.breakString = [ "NOTE", "USAGE", "DATA CHARACTERISTICS", "EXAMPLE", "EXAMPLES" ];
                        returnValue = getFieldInfo(R, texts, json, fieldNumber[0]);
                        var validEntries = returnValue;
                        validEntries = validEntriesFilter(validEntries);
                        console.log("\nvalidEntries= " + validEntries);
                        validEntries.split("\n");
                        jsonOutput.validEntries = validEntries;
                    }

                    // Valid Entry Notes
                    if ( field.breakValue == "NOTE") {
                        texts = json.formImage["Pages"][field.i]["Texts"];
                        R = texts[++field.j]["R"];
                        field.breakString = [ "USAGE", "DATA CHARACTERISTICS", "EXAMPLE", "EXAMPLES" ];
                        returnValue = getFieldInfo(R, texts, json, fieldNumber[0]);
                        var validEntryNotes = returnValue;
                        validEntryNotes = filter(validEntryNotes);
                        console.log("\nvalidEntryNotes= " + validEntryNotes);
                        jsonOutput.validEntryNotes = validEntryNotes;
                    }

                    // Usage
                    if ( field.breakValue == "USAGE") {
                        texts = json.formImage["Pages"][field.i]["Texts"];
                        R = texts[++field.j]["R"];
                        field.breakString = [ "NOTE", "DATA CHARACTERISTICS", "EXAMPLE", "EXAMPLES" ];
                        returnValue = getFieldInfo(R, texts, json, fieldNumber[0]);
                        var usage = returnValue;
                        usage = filter(usage);
                        if (usage.indexOf("required") > -1 ) {
                            console.log("\nusage= Required");
                        }
                        else if ( usage.indexOf("conditional") > -1 ) {
                            console.log("\nusage= Conditional");
                        }
                        jsonOutput.usage = usage;
                    }

                    // Usage Notes
                    if ( field.breakValue == "NOTE") {
                        texts = json.formImage["Pages"][field.i]["Texts"];
                        R = texts[++field.j]["R"];
                        field.breakString = [ "DATA CHARACTERISTICS", "EXAMPLE", "EXAMPLES" ];
                        returnValue = getFieldInfo(R, texts, json, fieldNumber[0]);
                        var usageNotes = returnValue;
                        usageNotes = filter(usageNotes);
                        console.log("\nusageNotes= " + usageNotes);
                        jsonOutput.usageNotes = usageNotes;
                    }


                    // Data Characteristics
                    if ( field.breakValue == "DATA CHARACTERISTICS") {
                        texts = json.formImage["Pages"][field.i]["Texts"];
                        R = texts[++field.j]["R"];
                        field.breakString = [ "EXAMPLE" ];
                        returnValue = getFieldInfo(R, texts, json, fieldNumber[0]);
                        var dataCharacteristics = returnValue;
                        dataCharacteristics = dataCharacteristics.split("\n");
                        dataCharacteristics = dataCharacteristics.join("");
                        dataCharacteristics = dataCharacteristics.split("%20");
                        console.log("fieldLength = " + dataCharacteristics[0]);
                        jsonOutput.fieldLength = dataCharacteristics[0];
                        var characteristics = "";
                        if ( dataCharacteristics[1].indexOf("alpha") > -1 && dataCharacteristics[1].indexOf("numeric") > -1) {
                            characteristics = "Alphanumeric";
                        }
                        else if ( dataCharacteristics[1].indexOf("alpha") > -1 ) {
                           characteristics = "Alpha";
                        }
                        else if ( dataCharacteristics[1].indexOf("numeric") > -1) {
                            characteristics = "Numeric";
                        }
                        jsonOutput.dataCharacteristics = characteristics;
                    }

                    // EXAMPLE OR EXAMPLES
                    if ( field.breakValue == "EXAMPLE" || field.breakValue == "EXAMPLES") {
                        field.j = texts.length;
                        break;
                    }
                }
            }
        }
    }
});

function getFieldInfo(R, texts, json, fieldNumber) {
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

            if ( checkField[0] == fieldNumber ) {
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
                field.breakValue = field.breakString[index];
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

function writeOutput() {

}