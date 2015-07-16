var fs = require('fs');

fs.readFile('asr.json', 'utf8', function(err, data) {
    if (err) {
        throw err;
    }
    var json = JSON.parse(data);

    var flag = 0;
    var sectionFlag = 0;
    for( var i = 0; i<json.formImage["Pages"].length; i++) {
//    for( var i = 0; i<2; i++) { // For each page
        var texts = json.formImage["Pages"][i]["Texts"];
        for( var j = 0; j<texts.length; j++) {  // For text in the page
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
                    R = texts[++j]["R"];
                    var title = R[0]["T"];
                    title = title.split("%20");
                    console.log("Title= " + title[0]);

                    // Name
                    R = texts[++j]["R"];
                    var name = R[k]["T"];
                    name = name.split("%20");
                    console.log("Name= " + name.join(" "));

                    // Description
                    R = texts[++j]["R"];
                    var note = R[k]["T"].split("%20");
                    var description = "";
                    while ( note[0]!= "NOTE" ) {
                        description = description + " " + R[k]["T"];
                        description = description.split("%20");
                        description = description.join(" ");
                        R = texts[++j]["R"];
                        note = R[k]["T"].split("%20");
                    }
                    console.log("\nDescription= " + description);

                    // Field Notes
                    R = texts[++j]["R"];
                    var validEntries = R[k]["T"].split("%3A");
                    validEntries = validEntries[0].split("%20");
                    validEntries = validEntries.join(" ");
                    var fieldNotes = "";
                    while ( validEntries!= "VALID ENTRIES" ) {
                        fieldNotes = fieldNotes + " " + R[k]["T"];
                        fieldNotes = fieldNotes.split("%20");
                        fieldNotes = fieldNotes.join(" ");
                        R = texts[++j]["R"];

                        validEntries = R[k]["T"].split("%3A");
                        validEntries = validEntries[0].split("%20");
                        validEntries = validEntries.join(" ");
                    }
                    fieldNotes = fieldNotes.split("NOTE");
                    fieldNotes = fieldNotes.join("\n");
                    console.log("\nField Notes= " + fieldNotes);

                    // Valid Entries
                    R = texts[++j]["R"];
                    var note = R[k]["T"].split("%20");
                    var validEntries = "";
                    while ( note[0]!= "NOTE" ) {
                        validEntries = validEntries + "\n" + R[k]["T"];
                        validEntries = validEntries.split("%20");
                        validEntries = validEntries.join(" ");
                        R = texts[++j]["R"];
                        note = R[k]["T"].split("%20");
                    }
                    console.log("\nvalidEntries= " + validEntries);

                    // Valid Entry Notes
                    R = texts[++j]["R"];
                    var usage = R[k]["T"].split("%3A");
                    var validEntryNotes = "";
                    while ( usage[0]!= "USAGE" ) {
                        validEntryNotes = validEntryNotes + " " + R[k]["T"];
                        validEntryNotes = validEntryNotes.split("%20");
                        validEntryNotes = validEntryNotes.join(" ");
                        if ( j + 1 == texts.length ) {
                            j = 0;
                            i++;
//                            console.log("i= " + i);
//                            console.log("json.formImage[Pages].length= " + json.formImage["Pages"].length);
                            texts = json.formImage["Pages"][i]["Texts"];
                        }

                        R = texts[++j]["R"];
                        usage = R[k]["T"].split("%3A");
//                        console.log("usage= " + usage[0]);
                    }
                    console.log("\nvalidEntryNotes= " + validEntryNotes);

                    // Usage
                    R = texts[++j]["R"];
                    var dataCharacteristics = R[k]["T"].split("%3A");
                    dataCharacteristics = dataCharacteristics[0].split("%20");
                    dataCharacteristics = dataCharacteristics.join(" ");
                    var usage = "";
                    while ( dataCharacteristics!= "DATA CHARACTERISTICS" ) {
                        usage = usage + " " + R[k]["T"];
                        usage = usage.split("%20");
                        usage = usage.join(" ");
                        R = texts[++j]["R"];
                        dataCharacteristics = R[k]["T"].split("%3A");
                        dataCharacteristics = dataCharacteristics[0].split("%20");
                        dataCharacteristics = dataCharacteristics.join(" ");
                    }
                    console.log("usage= " + usage);

                    // Data Characteristics
                    R = texts[++j]["R"];
                    dataCharacteristics = R[k]["T"].split("%20");
                    console.log("fieldLength = " + dataCharacteristics[0]);
                    if ( dataCharacteristics[1].indexOf("alpha") > -1 && dataCharacteristics[1].indexOf("numeric") > -1) {
                        console.log("characteristics = Alpha");
                    }
                    else if ( dataCharacteristics[1].indexOf("alpha") > -1 ) {
                        console.log("characteristics = Alpha");
                    }
                    else if ( dataCharacteristics[1].indexOf("numeric") > -1) {
                        console.log("characteristics = Numeric");
                    }
                }
            }
        }
    }
});