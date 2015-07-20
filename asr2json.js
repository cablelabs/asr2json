var fs = require('fs');

fs.readFile('asr.json', 'utf8', function(err, data) {
    if (err) {
        throw err;
    }
    json = JSON.parse(data);

    var flag = 0;
    var sectionFlag = 0;
//    for( var i = 0; i<json.formImage["Pages"].length; i++) {
    for( var i = 0; i<5; i++) { // For each page
        var texts = json.formImage["Pages"][i]["Texts"];
        for( j = 0; j<texts.length; j++) {  // For text in the page
            var R = texts[j]["R"];
            for( var k = 0; k<R.length; k++) {  // For each line
                var T = R[k]["T"];
                var TS = R[k]["TS"][2];

                // STORING FORM NAME
                if ( T == "3." && TS == "1") {
                    flag = 1;
                    continue;
                }
                if ( flag == 1 ) {
                    var checkIfForm = T.split("FORM");
                    if ( checkIfForm.length>1) {
                        var formName = T.split("(");
                        var formName = formName[1].split(")");
                        console.log(formName[0]);
                        flag = 0;
                        continue;
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
                    console.log("Field Number= " + fieldNumber[0]);

                    // Title
                    texts = json.formImage["Pages"][i]["Texts"];
                    R = texts[++j]["R"];
                    var title = R[0]["T"];
                    title = title.split("%20");
                    console.log("Title= " + title[0]);

                    // Name
                    texts = json.formImage["Pages"][i]["Texts"];
                    R = texts[++j]["R"];
                    var name = R[k]["T"];
                    name = name.split("%20");
                    console.log("Name= " + name.join(" "));

                    // Definition
                    texts = json.formImage["Pages"][i]["Texts"];
                    R = texts[++j]["R"];
                    var breakString = [ "NOTE", "VALID ENTRIES", "USAGE", "DATA CHARACTERISTICS", "EXAMPLE", "EXAMPLES" ];
                    var breakValue = "";
                    var returnValue = getFieldInfo(R, texts, json, i, j, k, breakString, breakValue, fieldNumber[0]);
                    // Copy back returned values
                    i = returnValue[0];
                    j = returnValue[1];
                    k = returnValue[2];
                    breakValue = returnValue[3];
                    var definition = returnValue[4];
                    definition = filter(definition);
                    console.log("Definition= " + definition);

                    // Field Notes
                    if ( breakValue == "NOTE") {
                        texts = json.formImage["Pages"][i]["Texts"];
                        R = texts[++j]["R"];
                        breakString = [ "VALID ENTRIES", "USAGE", "DATA CHARACTERISTICS", "EXAMPLE", "EXAMPLES" ];
                        returnValue = getFieldInfo(R, texts, json, i, j, k, breakString, breakValue, fieldNumber[0]);
                        // Copy back returned values
                        i = returnValue[0];
                        j = returnValue[1];
                        k = returnValue[2];
                        breakValue = returnValue[3];
                        var fieldNotes = returnValue[4];
                        fieldNotes = filter(fieldNotes);
                        console.log("\nField Notes= " + fieldNotes);
                    }

                    // Valid Entries
                    if ( breakValue == "VALID ENTRIES") {
                        texts = json.formImage["Pages"][i]["Texts"];
                        R = texts[++j]["R"];
                        breakString = [ "NOTE", "USAGE", "DATA CHARACTERISTICS", "EXAMPLE", "EXAMPLES" ];
                        returnValue = getFieldInfo(R, texts, json, i, j, k, breakString, breakValue, fieldNumber[0]);
                        // Copy back returned values
                        i = returnValue[0];
                        j = returnValue[1];
                        k = returnValue[2];
                        breakValue = returnValue[3];
                        var validEntries = returnValue[4];
                        console.log("\nvalidEntries= " + validEntries);
                    }

                    // Valid Entry Notes
                    if ( breakValue == "NOTE") {
                        texts = json.formImage["Pages"][i]["Texts"];
                        R = texts[++j]["R"];
                        breakString = [ "USAGE", "DATA CHARACTERISTICS", "EXAMPLE", "EXAMPLES" ];
                        returnValue = getFieldInfo(R, texts, json, i, j, k, breakString, breakValue, fieldNumber[0]);
                        // Copy back returned values
                        i = returnValue[0];
                        j = returnValue[1];
                        k = returnValue[2];
                        breakValue = returnValue[3];
                        var validEntryNotes = returnValue[4];
                        console.log("\nvalidEntryNotes= " + validEntryNotes);
                    }

                    // Usage
                    if ( breakValue == "USAGE") {
                        texts = json.formImage["Pages"][i]["Texts"];
                        R = texts[++j]["R"];
                        breakString = [ "NOTE", "DATA CHARACTERISTICS", "EXAMPLE", "EXAMPLES" ];
                        returnValue = getFieldInfo(R, texts, json, i, j, k, breakString, breakValue, fieldNumber[0]);
                        // Copy back returned values
                        i = returnValue[0];
                        j = returnValue[1];
                        k = returnValue[2];
                        breakValue = returnValue[3];
                        var usage = returnValue[4];
                        console.log("\nusage= " + usage);
                    }

                    // Usage Notes
                    if ( breakValue == "NOTE") {
                        texts = json.formImage["Pages"][i]["Texts"];
                        R = texts[++j]["R"];
                        breakString = [ "DATA CHARACTERISTICS", "EXAMPLE", "EXAMPLES" ];
                        returnValue = getFieldInfo(R, texts, json, i, j, k, breakString, breakValue, fieldNumber[0]);
                        // Copy back returned values
                        i = returnValue[0];
                        j = returnValue[1];
                        k = returnValue[2];
                        breakValue = returnValue[3];
                        var usageNotes = returnValue[4];
                        console.log("\nusageNotes= " + usageNotes);
                    }


                    // Data Characteristics
                    if ( breakValue == "DATA CHARACTERISTICS") {
                        texts = json.formImage["Pages"][i]["Texts"];
                        R = texts[++j]["R"];
                        breakString = [ "EXAMPLE" ];
                        returnValue = getFieldInfo(R, texts, json, i, j, k, breakString, breakValue, fieldNumber[0]);
                        // Copy back returned values
                        i = returnValue[0];
                        j = returnValue[1];
                        k = returnValue[2];
                        breakValue = returnValue[3];
                        var dataCharacteristics = returnValue[4];
                        console.log("\nDataCharacteristics= " + dataCharacteristics);
                    }

                    // EXAMPLE OR EXAMPLES
                    if ( breakValue == "EXAMPLE" || breakValue == "EXAMPLES") {
                        j = texts.length;
                        break;
                    }
                }
            }
        }
    }
});

function getFieldInfo(R, texts, json, i, j, k, breakString, breakValue, fieldNumber) {
    var line = R[k]["T"].split("%20");
    var fieldInfo = "";
    var fieldFlag = 0;
    while (true) {
        fieldInfo = fieldInfo + "\n" + R[k]["T"];
//        fieldInfo = fieldInfo.split("%20");
//        fieldInfo = fieldInfo.join(" ");
        // Move to next page if last line
        if ( j + 1 == texts.length ) {
            i++;
            texts = json.formImage["Pages"][i]["Texts"];
            var checkField = texts[5]["R"][0]["T"].split(".");

            if ( checkField[0] == fieldNumber ) {
                j = 6;
            }
            else {
                break;
            }
        }
        R = texts[++j]["R"];
        line = R[k]["T"].split("%20");
        line = line.join(" ");

        for ( var index=0; index<breakString.length; index++ ) {
            if ( line.indexOf( breakString[index] ) > -1 ) {
                breakValue = breakString[index];
                fieldFlag = 1;
                break;
            }
        }
        if ( fieldFlag == 1 ) {
            break;
        }
    }
    return([ i, j, k, breakValue, fieldInfo ]);
}

function filter(definition) {
    var splitValues = [ "T\n", "\n", "%20", " b y ", " o f ", " NOTE ", "%2C", "%E2%80%9C", "%E2%80%9D", "%E2%80%99", "%2F", "1%3A ", "2%3A ", "3%3A ", "4%3A ", "5%3A ", "6%3A ", "7%3A " ];
    var joinValues = [ "T", " ", " ", " by ", " of ", "", ",", "\"", "\"", "\'", "/", "\n", "\n", "\n", "\n", "\n", "\n", "\n" ];

//    definition = definition.split("T\n");
//    definition = definition.join("T");
//    definition = definition.split("\n");
//    definition = definition.join(" ");
//    definition = definition.split("%20");
//    definition = definition.join(" ");
//    definition = definition.split(" b y ");
//    definition = definition.join(" by ");
//    definition = definition.split(" o f ");
//    definition = definition.join(" of ");
//    definition = definition.split("%2C");
//    definition = definition.join(",");
//    definition = definition.split("%E2%80%9C");
//    definition = definition.join("\"");
//    definition = definition.split("%E2%80%9D");
//    definition = definition.join("\"");
//    definition = definition.split("%E2%80%99");
//    definition = definition.join("\'");
//    definition = definition.split("%2F");
//    definition = definition.join("/");
//
//    var splitValues = [ "1%3A ", "2%3A ", "3%3A ", "4%3A ", "5%3A ", "6%3A ", "7%3A " ];
    for( var i = 0; i < splitValues.length; i++ ) {
        definition = definition.split(splitValues[i]);
        definition = definition.join(joinValues[i]);
    }
    return definition;
}