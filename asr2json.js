var fs = require('fs');

fs.readFile('asr.json', 'utf8', function(err, data) {
    if (err) {
        throw err;
    }
    json = JSON.parse(data);

    var flag = 0;
    var sectionFlag = 0;
    for( var i = 0; i<json.formImage["Pages"].length; i++) {
//    for( var i = 0; i<2; i++) { // For each page
        var texts = json.formImage["Pages"][i]["Texts"];
        for( j = 0; j<texts.length; j++) {  // For text in the page
            var R = texts[j]["R"];
            for( var k = 0; k<R.length; k++) {  // For each line
                var T = R[k]["T"];
                var TS = R[k]["TS"][2];

//                console.log("\nText= " + T + " \n");

                // STORING FORM NAME
                if ( T == "3." && TS == "1") {
                    flag = 1;
//                    console.log(T);
                    continue;
                }
                if ( flag == 1 ) {
                    var checkIfForm = T.split("FORM");
                    if ( checkIfForm.length>1) {
                        var formName = T.split("(");
                        var formName = formName[1].split(")");
//                        console.log(formName[0]);
                        flag = 0;
                        continue;
                    }
                }

//                console.log("After form filter Text= " + T );

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
//                    console.log("sectionNumber[1].length= " + sectionNumber[1].length );
//                    console.log("sectionNumber[1]= " + sectionNumber[1] );
//                    console.log("Section filter Text= " + T );
                    sectionFlag = 1;
                    continue;
                }

//                console.log("After section filter Text= " + T + " \n");

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

                    // Description
                    texts = json.formImage["Pages"][i]["Texts"];
                    console.log("text= " + texts[j]["R"][0]["T"]);
                    R = texts[++j]["R"];
                    var breakString = [ "NOTE", "VALID ENTRIES", "USAGE", "DATA CHARACTERISTICS", "EXAMPLE", "EXAMPLES" ];
                    var breakValue = "";
                    var returnValue = getFieldInfo(R, texts, json, i, j, k, breakString, breakValue, fieldNumber[0]);
                    // Copy back returned values
                    i = returnValue[0];
                    j = returnValue[1];
                    k = returnValue[2];
                    breakValue = returnValue[3];
                    var description = returnValue[4];
                    console.log("Description= " + description);

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
                    console.log("BreakValue= " + breakValue);
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
        fieldInfo = fieldInfo + " " + R[k]["T"];
        fieldInfo = fieldInfo.split("%20");
        fieldInfo = fieldInfo.join(" ");
        // Move to next page if last line
        if ( j + 1 == texts.length ) {
            console.log("\nEND OF PAGE\n" + fieldInfo);
            i++;
            texts = json.formImage["Pages"][i]["Texts"];
            var checkField = texts[5]["R"][0]["T"].split(".");


            if ( checkField[0] == fieldNumber ) {
                console.log("FIELD NUMBER SAME " + checkField + "         " + fieldNumber);
                j = 6;
            }
            else {
                break;
            }
        }
        R = texts[++j]["R"];
        line = R[k]["T"].split("%20");
        line = line.join(" ");

//        console.log("FieldInfo= " + fieldInfo);
//        console.log("Line= " + line);

        for ( var index=0; index<breakString.length; index++ ) {
//            console.log("In loop");
//            console.log("Line= " + line);
            if ( line.indexOf( breakString[index] ) > -1 ) {
                breakValue = breakString[index];
                console.log("BreakValue= " + breakValue);
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