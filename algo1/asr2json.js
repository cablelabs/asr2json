var fs = require('fs');
var field = {};
var currentPointer = {};

fs.readFile('asr.json', 'utf8', function(err, data) {
    if (err) {
        throw err;
    }
    var json = JSON.parse(data);
    field.fieldNumber = 0;
    for( var i = 0; i<json.formImage["Pages"].length; i++) {
        var texts = json.formImage["Pages"][i]["Texts"];
        field.fieldNumber = processPage(texts,field);
    }
});


//function to process the page and retrieve the definitions in the json file page by page
function processPage(texts,field){
    var previous = " ";
    var content = " ";
    var fieldnumber = " ";
    var notesFlag = " ";  //flag for notes.  field notes,  Valid entry notes,  Usage notes,  Example notes.
    var section_flag = "";        // flag to indicate the section for the field (admin, bill, contact)
    for( var j = 0; j<texts.length; j++) {
        var R = texts[j]["R"];
        for( var k = 0; k<R.length; k++) {
            var value = R[k]["T"];
            var TS = R[k]["TS"];

            var bold = TS[2];
            value = decodeURI(value);
           if(bold === 1){
            //bold and a keyword
            if(isNaN(value)){
            //call to split data characteristics
                printContent(previous,content);
                content = " ";
                if(value.indexOf("FORM") > -1){           //keyword form
                    field.form = value.substring(value.indexOf("(")+1, value.indexOf(")"));
                    var directory = "./" + field.form;
                    if (!fs.existsSync(directory)) {
                        fs.mkdirSync(directory);
                    }
                }else if(value.indexOf("SECTION") > -1){   //keyword section
//                    Checks to find the section for the fields
                    section_flag = value.substring(0,(value.indexOf("SECTION")));
                    field.section = section_flag;
                    previous = "section";
                }else if(value.indexOf("NOTE") > -1){
                    previous = "notes";
                    previous = notesFlag + " " +previous;
                }else if(value.indexOf("VALID ENTRIES") > -1){
                    previous = "valid entries";
                    notesFlag = previous;
                }else if(value.indexOf("USAGE") > -1){
                    previous = "usage";
                    notesFlag = previous;
                }else if(value.indexOf("DATA CHARACTERISTICS") > -1){
                    previous = "data";
                }else if(value.indexOf("EXAMPLE") > -1 || value.indexOf("EXAMPLES") > -1){
                    previous = "example";
                    notesFlag = previous;
                }else{
                    if(previous === " " || previous === "section"){
//                        check for fields
                        var numb = (parseInt(fieldnumber) != (field.fieldNumber+1) ? getFieldNumber(value) : parseInt(fieldnumber));
                        if(numb === (field.fieldNumber+1)){
                            previous = "title";
                            writeToFile();
                            clear();
                            field.fieldNumber = numb;
                            field.title = getTitle(value);
                            field.processed = new Date();
                            printContent("form", field.form);
                            printContent("section",field.section);
                            printContent(previous,field.title);
                            printContent("fieldNumber",field.fieldNumber);
                            notesFlag = "field";
                        }else{
                            notesFlag = currentPointer.notesFlag;
                        }
                    }else{
                        if(value != "-"){                 //for bold in valid entries
                            previous = notesFlag;
//                            content  = content + value;
                            printContent(previous,value);
                        }
                    }
                }
            }else{
//                if(previous === "VALID ENTRIES"){
//                    //add to valid entries
//                }
                fieldnumber = value;
            }
//            If the string is not in bold
//              Have to check for not bold after continued appears
           }else if(bold === 0){
                if(previous === "title"){
                    previous = "name";
                    field.name = value;
                    printContent(previous,field.name);
                }else if(previous === "name" || previous === "definition"){
                    content = content + value;
                    previous = "definition";
                    notesFlag = "field";
                }else if(previous != " "){
                    content = content + value;
//                }else if(previous === "form"){
                    //ignore the form description
                }
            }
        }
    }
    currentPointer.notesFlag = notesFlag;
    printContent(previous,content);           //for examples
    return field.fieldNumber;
}


//function to get the fieldNumber
function getFieldNumber(content){
    var value = content.replace(/ /,'');
    var fieldNumber = parseInt(value.substring(0,(value.indexOf("."))));
    return fieldNumber;
}


//function to convert valid entries to value/description format
//function formatValidEntries(content){
//}


//function to get field length and characteristics
function getLength(content){
    var values = content.trim();
    values = values.split(" ");
    field.fieldLength = values[0];
    printContent("fieldLength",field.fieldLength);
    if(values[1] === "alpha"){
        field.characteristics = "Alpha";
    }else if(values[1] === "numeric"){
        field.characteristics = "Numeric";
    }else if(values[1].indexOf("%2F") > -1){
        field.characteristics = "AlphaNumeric";
    }
    return field.characteristics;
}


//extract the title, field fieldnumber
function getTitle(content){
    var title = " ";
    var values = content.replace(/ |-/g,'');
    if(content.indexOf(".") > -1){
        var num = values.substring(0,values.indexOf("."));
        values = values.substring((values.indexOf(".")+1),values.length);
        title = title + values;
    }else{
        return values;
    }
    return title;
}


////function to populate the object field
function addToField(previous,content){
    if(previous === "definition"){
        field.definition = content;
    }else if(previous === "field notes"){
        field.fieldNotes.push(content);
    }else if(previous === "valid entries notes"){
        field.validEntryNotes.push(content);
    }else if(previous === "usage notes"){
        field.usageNotes.push(content);
    }else if(previous === "usage"){
        field.usage = content;
    }else if(previous === "example"){
        field.example = content;
    }else if(previous === "valid entries"){
        field.validEntry.push(content);
    }
}


//print the definition read in the json file
function printContent(previous,content){
    if(previous === " " && content === " "){
    }else if(content != " "){
        if(previous != "data" && isNaN(content)){
        content = convertToText(content);
        addToField(previous,content);
        }else if(previous === "data"){
            content = getLength(content);
            previous = "characteristics";
        }
    }
}


//function to convert the special characters in text
//returns the converted text
function convertToText(content){
    var specialCharacters= [ "T\n", "\n", "%20", "%26", " b y ", " o f ", " w ithin ", "%2C", "%E2%80%9C", "%E2%80%9D", "%E2%80%99", "%2F", "%3A ", "2%3A ", "3%3A ", "4%3A ", "5%3A ", "6%3A ", "7%3A ", " %3D ", " - " ];
    var joinText = [ "T", "  ", " ", " & " , " by ", " of ", " within ", ",", "\"", "\"", "\'", "/", ":\n", "\n", "\n", "\n", "\n", "\n", "\n", "=", " " ];
       for( var index = 0; index < specialCharacters.length; index++ ) {
           content = content.split(specialCharacters[index]);
           content = content.join(joinText[index]);
           content = content.trim();
       }
    return content;
}

//prevFieldNumber, formName, field
function writeToFile() {
    console.log(JSON.stringify(field, null, 4));
    outputFileName =  field.form + "/" + field.title + "meta.json";
    fs.writeFile(outputFileName, JSON.stringify(field, null, 4), function(err) {
        if (err) {
            return console.log(err);
        }
    })
}


//function to clear field properties
function clear(){
    field.fieldNotes = [];
    field.usageNotes = [];
    field.validEntryNotes = [];
    field.validEntry = [];
}