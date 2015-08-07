var fs = require('fs');
var field = {"asogVersion": "", "processed": "", "form": "", "section": "", "name": "", "title": "", "fieldNumber": "", "fieldLength": "", "characteristics": "", "usage": "", "example": "", "definition": "", "validEntry": "", "validEntryNotes": "", "usageNotes": "", "fieldNotes": ""};
field.breakString = [ "NOTE", "VALID ENTRIES", "USAGE", "DATA CHARACTERISTICS", "EXAMPLE", "EXAMPLES" ];
field.breakValue = "EXAMPLE";
field.asogVersion = "50";
field.processed = new Date();

fs.readFile('asrpdf.json', 'utf8', function(err, data) {
    if (err) {
        throw err;
    }
    // TODO: line consolidator on json
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
            isBold = field.R[0]["TS"][2];

            // STORING FORM NAME
            // TODO : Change 3. to constant (wherever possible)

            if ( T == "3." && isBold == "1" && field.texts[field.j+1]["R"][0]["T"].indexOf("FORM")>-1) {
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

            // TODO : Add isBold function
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
            else if ( !isNaN(sectionNumber[0]) && !isNaN(sectionNumber[1]) && sectionNumber[1].length>0 && isBold == "1") {
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
                field.title = (field.R[0]["T"].split("%20"))[0];
                console.log("Title= " + field.title);

                // Name
                field.R = field.texts[++field.j]["R"];
                field.name = (field.R[0]["T"].split("%20")).join(" ");
                console.log("Name= " + field.name);

                // Definition
                field.R = field.texts[++field.j]["R"];
                field.definition = filter(getFieldInfo(json));
                console.log("Definition= " + field.definition);

                do {
                    // Field Notes
                    if ( field.breakValue == "FIELD NOTES") {
                        field.fieldNotes = filter(getFieldInfo(json));
//                        field.fieldNotes = filter(field.fieldNotes);
                        console.log("\nField Notes= " + field.fieldNotes);
                        field.fieldNotes = field.fieldNotes.split("\n");
                    }

                    // Valid Entries
                    if ( field.breakValue == "VALID ENTRIES") {
//                        if ( 'validEntry' in field ) {
                        if ( field[validEntry] != "" && field[validEntry] != undefined ) {
                            validEntry = validEntry + "\n" + getFieldInfo(json);
                        }
                        else {
                            var validEntry = getFieldInfo(json);
                        }
                        validEntryFilter(validEntry);
//                        field.validEntry = field.validEntry.split("\n");
                        console.log("\nvalidEntry= " + field.validEntry);
                    }

                    // Valid Entry Notes
                    if ( field.breakValue == "VALID ENTRY NOTES") {
                        field.validEntryNotes = filter(getFieldInfo(json));
                        console.log("\nvalidEntryNotes= " + field.validEntryNotes);
                    }

                    // Usage
                    if ( field.breakValue == "USAGE") {
                        field.usage = filter(getFieldInfo(json));
                        if (field.usage.indexOf("required") > -1 ) {
                            field.usage = "Required";
                            console.log("\nusage= Required");
                        }
                        else if ( field.usage.indexOf("conditional") > -1 ) {
                            field.usage = "Conditional";
                            console.log("\nusage= Conditional");
                        }
                        else if ( field.usage.indexOf("optional") > -1 ) {
                            field.usage = "Optional";
                            console.log("\nusage= Optional");
                        }
                    }

                    // Usage Notes
                    if ( field.breakValue == "USAGE NOTES") {
                        field.usageNotes = filter(getFieldInfo(json));
                        console.log("\nusageNotes= " + field.usageNotes);
                    }

                    // Data Characteristics
                    if ( field.breakValue == "DATA CHARACTERISTICS") {
                        field.characteristics = getFieldInfo(json);
                        field.characteristics = ((field.characteristics.split("\n")).join("")).split("%20");
                        console.log("fieldLength = " + field.characteristics[0]);
                        field.fieldLength = field.characteristics[0];
                        var characteristics = "";
                        if ( field.characteristics[1].indexOf("alpha") > -1 && field.characteristics[1].indexOf("numeric") > -1) {
                            characteristics = "Alphanumeric";
                        }
                        else if ( field.characteristics[1].indexOf("alpha") > -1 ) {
                           characteristics = "Alpha";
                        }
                        else if ( field.characteristics[1].indexOf("numeric") > -1) {
                            characteristics = "Numeric";
                        }
                        console.log("characteristics =" + characteristics);
                        field.characteristics = characteristics;
                    }

                    // EXAMPLE OR EXAMPLES
                    if ( field.breakValue == "EXAMPLE" || field.breakValue == "EXAMPLES") {
                        field.example = getFieldInfo(json);
                        console.log("examples = " + field.example);
                        //field.j = field.texts.length;
                        //break;
                    }
                } while ( field.breakValue!="EXAMPLE" && field.breakValue!="EXAMPLES" );
            }
//            if(field.i > 10) {
//                break;
//            }
        }
    }
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
    return definition.trim();
}

function validEntryFilter(definition) {
    var splitValues = [ "%3D%20", "%2F", "%2C", "%3D", "= \n", "\n=", "%20", "T\n", "%E2%80%93", "%3A", "\n1\nst\n Character" ];
    var joinValues = [ "= ", "/", ",", "=", "=", "=", " ", "T", "-", ":", "1st Character" ];

    for( var index = 0; index < splitValues.length; index++ ) {
        definition = definition.split(splitValues[index]);
        definition = definition.join(joinValues[index]);
    }
    definition = definition.split("\n");

//    field.validEntry = definition;
    field.validEntry = [];
    field.count = 0;

    console.log("definition length=" + definition.length);
    for ( var index = 0; index < definition.length; index++ ) {
        console.log("definition[index]=" + definition[index]);
        var len = definition[index].length;
        field.validEntry[field.count] = {};
        if ( definition[index].indexOf("=") > -1 && definition[index].indexOf("=")!=0 && definition[index].indexOf("=")!=len-1 ) {
            console.log("CASE 1");
            field.validEntry[field.count].value = definition[index].split("=")[0];
            field.validEntry[field.count].description = definition[index].split("=")[1];
            console.log("field.validEntry[field.count]= " + field["validEntry"][field.count]);
            console.log("field.validEntry[field.count].value= " + field["validEntry"][field.count]["value"]);
            console.log("field.validEntry[field.count].description= " + field["validEntry"][field.count]["description"]);
            field.count++;
        }
        else if ( definition[index].indexOf("=") > -1 && definition[index].indexOf("=")==0 ) {
            console.log("CASE 2");
            field.validEntry[field.count].value = definition[index].split("=")[1];
            field.validEntry[field.count].description = definition[index - 1];
            field.count++;
        }
        else if ( definition[index].indexOf("=") > -1 && definition[index].indexOf("=")==len-1 ) {
            console.log("CASE 3");
            field.validEntry[field.count].value = definition[index].split("=")[0];
            field.validEntry[field.count].description = definition[index + 1];
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
                field.validEntry[field.count].value = "";
                console.log("defn.index= " + definition[index]);
                field.validEntry[field.count].description = definition[index];
                console.log("field.validEntry[field.count].description= " + field.validEntry[field.count].description);
                field.count++;
            }
        }
    }
    console.log("field.validEntry= " + field.validEntry);
//    return field.validEntry;
}

function writeOutput(prevFieldNumber, field) {
    var dir = "./" + field.form;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    outputFileName =  field.form + "/" + field.title + ".json";
    fs.writeFile(outputFileName, JSON.stringify(field, replacer, 4), function(err) {
        if (err) {
            return console.log(err);
        }
    })
}

function replacer(key, value) {
    if ( key=="R" || key=="texts" || key=="i" || key=="j" || key=="k" || key=="breakString" || key=="breakValue" || key=="count") {
        return undefined;
    }
    return value;
}

function cleanFieldProperties() {
    for ( var key in field ) {
        if ( key!="i" && key!="j" && key!="k" && key!="breakString" && key!="breakValue" && key!="asogVersion" && key!="processed" && key!="form" && key!="section") {
            delete field[key];
            field[key] = "";
        }
    }
}