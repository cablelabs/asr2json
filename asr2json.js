var fs = require('fs');
var ofs = require('fs');
var field = {};
field.breakString = [ "NOTE", "VALID ENTRIES", "USAGE", "DATA CHARACTERISTICS", "EXAMPLE", "EXAMPLES" ];
field.breakValue = "EXAMPLE";
field.asogVersion = "50";
field.processed = new Date();

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
        field.texts = json.formImage["Pages"][field.i]["Texts"];
        for( field.j = 0; field.j<field.texts.length; field.j++) {  // For text in the page
            field.R = field.texts[field.j]["R"];
            T = field.R[0]["T"];
            TS = field.R[0]["TS"][2];

            // STORING FORM NAME
            if ( T == "3." && TS == "1" && field.texts[field.j+1]["R"][0]["T"].indexOf("FORM")>-1) {
                field.R = field.texts[++field.j]["R"];
                T = field.R[0]["T"];
                var checkIfForm = T.split("FORM");
                if ( checkIfForm.length>1 ) {
                    field.form = T.split("(");
                    field.form = (field.form[1].split(")"))[0];
                    console.log(field.form);
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
                        field.section = section.join(" ").trim();
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
                    writeOutput(prevFieldNumber, field);
                    cleanFieldProperties();
                    field.fieldNumber = currentFieldNumber[0];
                }
                else {
                    field.fieldNumber = currentFieldNumber[0];
                }

                console.log("\nField Number= " + field.fieldNumber);

                // Title
                field.texts = json.formImage["Pages"][field.i]["Texts"];
                field.R = field.texts[++field.j]["R"];
                field.title = field.R[0]["T"].split("%20");
                field.title = field.title[0];
                console.log("Title= " + field.title);

                // Name
                field.texts = json.formImage["Pages"][field.i]["Texts"];
                field.R = field.texts[++field.j]["R"];
                field.name = field.R[0]["T"].split("%20");
                field.name = field.name.join(" ");
                console.log("Name= " + field.name);

                // Definition
                field.texts = json.formImage["Pages"][field.i]["Texts"];
                field.R = field.texts[++field.j]["R"];
                field.definition = getFieldInfo(json);
                field.definition = filter(field.definition);
                console.log("Definition= " + field.definition);

                do {
                    // Field Notes
                    if ( field.breakValue == "FIELD NOTES") {
                        field.fieldNotes = getFieldInfo(json);
                        field.fieldNotes = filter(field.fieldNotes);
                        console.log("\nField Notes= " + field.fieldNotes);
                        field.fieldNotes = field.fieldNotes.split("\n");
                    }

                    // Valid Entries
                    if ( field.breakValue == "VALID ENTRIES") {
                        if ( 'validEntries' in field ) {
                            validEntries = validEntries + "\n" + getFieldInfo(json);
                        }
                        else {
                            var validEntries = getFieldInfo(json);
                        }
                        validEntriesFilter(validEntries);
//                        field.validEntries = field.validEntries.split("\n");
                        console.log("\nvalidEntries= " + field.validEntries);
                    }

                    // Valid Entry Notes
                    if ( field.breakValue == "VALID ENTRY NOTES") {
                        field.validEntryNotes = getFieldInfo(json);
                        field.validEntryNotes = filter(field.validEntryNotes);
                        console.log("\nvalidEntryNotes= " + field.validEntryNotes);
                    }

                    // Usage
                    if ( field.breakValue == "USAGE") {
                        field.usage = getFieldInfo(json);
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
                        field.usageNotes = getFieldInfo(json);
                        field.usageNotes = filter(field.usageNotes);
                        console.log("\nusageNotes= " + field.usageNotes);
                    }

                    // Data Characteristics
                    if ( field.breakValue == "DATA CHARACTERISTICS") {
                        field.dataCharacteristics = getFieldInfo(json);
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
                        console.log("characteristics =" + characteristics);
                        field.dataCharacteristics = characteristics;
                    }

                    // EXAMPLE OR EXAMPLES
                    if ( field.breakValue == "EXAMPLE" || field.breakValue == "EXAMPLES") {
                        field.examples = getFieldInfo(json);
                        console.log("examples = " + field.examples);
                        //field.j = field.texts.length;
                        //break;
                    }
                } while ( field.breakValue!="EXAMPLE" && field.breakValue!="EXAMPLES" );
            }
//            if(field.i > 4) {
//                break;
//            }
        }
    }

    var var1={};
    var1.validEntries =[];
    var1.validEntries[0] = {};
    var1.validEntries[0].value = "abc";
    var1.validEntries[0].desc = "xyz";
    console.log(var1["validEntries"][0]["value"]);
});

function getFieldInfo(json) {
//    console.log("Text= " + field.R[0]["T"]);

    var line = field.R[0]["T"].split("%20");
    var fieldInfo = "";
    var fieldFlag = 0;
    while (true) {
        fieldInfo = fieldInfo + "\n" + field.R[0]["T"];
        // Move to next page if last line
        if ( field.j + 1 == field.texts.length ) {
            // Check if end of file
            if ( field.i + 1 == json.formImage["Pages"].length ) {
                return(fieldInfo);
            }
            field.texts = json.formImage["Pages"][++field.i]["Texts"];
            var checkField = field.texts[5]["R"][0]["T"].split(".");

            if ( checkField[0] == field.fieldNumber ) {
                field.j = 6;
            }
            else {
                field.j = 3;
                break;
            }
        }
        field.R = field.texts[++field.j]["R"];
        line = field.R[0]["T"].split("%20");
        line = line.join(" ");
        //console.log("Line= " + line);
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
//    console.log("i= " + field.i);
//    console.log("j= " + field.j);
    field.texts = json.formImage["Pages"][field.i]["Texts"];
    field.R = field.texts[++field.j]["R"];
//    console.log("Next text= " + field.R[0]["T"]);
    return(fieldInfo);
}

function filter(definition) {
    var splitValues = [ "T\n", "\n", "%20", " b y ", " o f ", " w ithin ", " w indow ", " CUS Tfield ", " w ith ", " uniquel y ", " Telcordi a ", " NOTE ", "%2C", "%E2%80%9C", "%E2%80%9D", "%E2%80%99", "%2F", "1%3A ", "2%3A ", "3%3A ", "4%3A ", "5%3A ", "6%3A ", "7%3A " ];
    var joinValues = [ "T", " ", " ", " by ", " of ", " within ", " window ", " CUST field ", " with ", " uniquely ",  "Telcordia", "", ",", "\"", "\"", "\'", "/", "\n", "\n", "\n", "\n", "\n", "\n", "\n" ];
    for( var index = 0; index < splitValues.length; index++ ) {
        definition = definition.split(splitValues[index]);
        definition = definition.join(joinValues[index]);
    }
    return definition;
}

function validEntriesFilter(definition) {
//    var splitValues = [ "%20", "%2F", "%3D", "= \n" ];
//    var joinValues = [ " ", "/", "=", "= " ];
    var splitValues = [ "%3D%20", "%2F", "%2C", "%3D", "= \n", "\n=", "%20", "T\n", "%E2%80%93", "%3A", "\n1\nst\n Character" ];
    var joinValues = [ "= ", "/", ",", "=", "=", "=", " ", "T", "-", ":", "1st Character" ];

    for( var index = 0; index < splitValues.length; index++ ) {
        definition = definition.split(splitValues[index]);
        definition = definition.join(joinValues[index]);
    }
    definition = definition.split("\n");

//    field.validEntries = definition;
    field.validEntries = [];
    field.count = 0;

    console.log("definition length=" + definition.length);
    for ( var index = 0; index < definition.length; index++ ) {
        console.log("definition[index]=" + definition[index]);
        var len = definition[index].length;
        field.validEntries[field.count] = {};
        if ( definition[index].indexOf("=") > -1 && definition[index].indexOf("=")!=0 && definition[index].indexOf("=")!=len-1 ) {
            console.log("CASE 1");
            field.validEntries[field.count].value = definition[index].split("=")[0];
            field.validEntries[field.count].description = definition[index].split("=")[1];
            console.log("field.validEntries[field.count]= " + field["validEntries"][field.count]);
            console.log("field.validEntries[field.count].value= " + field["validEntries"][field.count]["value"]);
            console.log("field.validEntries[field.count].description= " + field["validEntries"][field.count]["description"]);
            field.count++;
        }
        else if ( definition[index].indexOf("=") > -1 && definition[index].indexOf("=")==0 ) {
            console.log("CASE 2");
            field.validEntries[field.count].value = definition[index].split("=")[1];
            field.validEntries[field.count].description = definition[index - 1];
            field.count++;
        }
        else if ( definition[index].indexOf("=") > -1 && definition[index].indexOf("=")==len-1 ) {
            console.log("CASE 3");
            field.validEntries[field.count].value = definition[index].split("=")[0];
            field.validEntries[field.count].description = definition[index + 1];
            field.count++;
        }
        else {
            console.log("CASE 4");
            var flag = 0;
            if ( index == 0 ) {
                if(definition[index + 1].indexOf("=") <=-1) {
                    flag = 1;
                }
            }
            else if ( index == definition.length - 1 ) {
                if(definition[index - 1].indexOf("=") <=-1) {
                    flag = 1;
                }
            }
            else if( definition[index - 1].indexOf("=")!= definition[index - 1].length && definition[index + 1].indexOf("=")!=0) {
                flag = 1;
            }
            if ( flag == 1 ) {
                field.validEntries[field.count].value = "";
                console.log("defn.index= " + definition[index]);
                field.validEntries[field.count].description = definition[index];
                console.log("field.validEntries[field.count].description= " + field.validEntries[field.count].description);
                field.count++;
            }
        }
    }
    console.log("field.validEntries= " + field.validEntries);
//    return field.validEntries;
}

function writeOutput(prevFieldNumber, field) {
    var dir = "./" + field.form;
    if (!ofs.existsSync(dir)) {
        ofs.mkdirSync(dir);
    }
    outputFileName =  field.form + "/" + field.title + ".json";
    ofs.writeFile(outputFileName, JSON.stringify(field, replacer, 4), function(err) {
        if (err) {
            return console.log(err);
        }
    })
}

function replacer(key, value) {
    if ( key=="R" || key=="texts" || key=="i" || key=="j" || key=="k" || key=="breakString" || key=="breakValue") {
        return undefined;
    }
    return value;
}

function cleanFieldProperties() {
    for ( var key in field ) {
        if ( key!="i" && key!="j" && key!="k" && key!="breakString" && key!="breakValue" && key!="asogVersion" && key!="processed" && key!="form" && key!="section") {
            delete field[key];
        }
    }
}