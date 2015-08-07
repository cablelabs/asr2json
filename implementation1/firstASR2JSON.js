var fs = require('fs');
var field = {};

fs.readFile('asr.json', 'utf8', function(err, data) {
    if (err) {
        throw err;
    }
    var json = JSON.parse(data);
    field.fieldNumber = 0;
    for( var i = 0; i<json.formImage["Pages"].length; i++) {
        var texts = json.formImage["Pages"][i]["Texts"];
        field.fieldNumber = processPage(texts,field);
        if(i === json.formImage["Pages"].length-1){     //for the last field
            writeToFile();
        }
    }
});


//function to process the page and retrieve the definitions in the json file page by page
function processPage(texts,field){
    var previous = " ";
    var validTitles = " ";
    var content = " ";
    var fieldnumber = " ";
    var notesFlag = " ";  //flag for notes.  field notes,  Valid entry notes,  Usage notes,  Example notes.
    var section_flag = "";        // flag to indicate the section for the field (e.g. admin, bill, contact)
    for( var j = 0; j<texts.length; j++) {
        var R = texts[j]["R"];
        for( var k = 0; k<R.length; k++) {
            var value = R[k]["T"];
            var TS = R[k]["TS"];

            var bold = TS[2];
            field.processed = new Date();
            value = decodeURIComponent(value);
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
//                        fs.mkdirSync(directory);
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
                            field.title = getTitle(value);
                            field.fieldNumber = numb;
                            notesFlag = "field";
                        }else{
                            notesFlag = field.notesFlag;
//                            console.log(notesFlag);
                        }
                    }else{
                        if(value != "-"){                 //for bold in valid entries
                            previous = notesFlag;
//                            validTitles = validTitles + value;
                            content  = content + value + " ";
//                            printContent(previous,value);
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
           }else if(bold === 0){
                if(previous === "title"){
                    previous = "name";
                    field.name = value.replace(/-/g,"");
                }else if(previous === "name" || previous === "definition"){
                    content = content + value;
                    previous = "definition";
                    notesFlag = "field";
                }else if(previous != " "){
                    content = content + value;
                    validTitles = " ";
                }
            }
        }
    }
    field.notesFlag = notesFlag;
    printContent(previous,content);           //for the end of the page
    return field.fieldNumber;
}


//function to get the fieldNumber
function getFieldNumber(content){
    var value = content.replace(/ /,'');
    var fieldNumber = parseInt(value.substring(0,(value.indexOf("."))));
    return fieldNumber;
}


//function to convert valid entries to value/description format
function formatValidEntries(content){
//    console.log(content);
//    console.log(" ...");
    var re = /=/g;
    var lastSpace = 0;
    var subStr = " ";
    var equalSign = [];
    while((match = re.exec(content))!= null){
        equalSign.push(match.index);
    }
    for(var i = 0;i<equalSign.length;i++){
        subStr = content.substring(lastSpace,equalSign[i]);
        lastSpace = subStr.lastIndexOf(" ");
        field.validEntry.description = subStr.substring(0,lastSpace);
        field.validEntry.value = subStr.substring(lastSpace,equalSign[i]);
    }
}


//function to get field length and characteristics
function getLength(content){
    var values = content.trim();
    values = values.split(" ");
    field.fieldLength = values[0];
    if(values[1] === "alpha"){
        field.characteristics = "Alpha";
    }else if(values[1] === "numeric"){
        field.characteristics = "Numeric";
    }else if(values[1].indexOf("%2F") > -1){
        field.characteristics = "AlphaNumeric";
    }
}


//extract the title, field fieldnumber
function getTitle(content){
    var title = " ";
    var values = content.replace(/ |-/g,'');
    values = (values.replace(/%2F/g,"/"));
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
    content = convertToText(content);
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
        formatValidEntries(content);
        field.validEntry.push(content);
    }
}


//print the definition read in the json file
function printContent(previous,content){
    if(previous === " " && content === " "){
    }else if(content != " "){
        if(previous != "data" && isNaN(content)){
        addToField(previous,content);
        }else if(previous === "data"){
            getLength(content);
            previous = "characteristics";
        }
    }
}


//function to convert the special characters in text
//returns the converted text
function convertToText(content){
    var specialCharacters= [ "T\n", "\n", "%20", "%26", "%2C", "%E2%80%9C", "%E2%80%9D", "%E2%80%99", "%2F", "%3A ", "y%3A ", "3%3A ", "4%3A ", "5%3A ", "6%3A ", "7%3A ", " %3D ", " - ", "m%3A" ];
    var joinText = [ "T", "  ", " ", " & " , ",", "\"", "\"", "\'", "/", ": ", "\n", "\n", "\n", "\n", "\n", "\n", "=", " ", "m:" ];
       for( var index = 0; index < specialCharacters.length; index++ ) {
           content = content.split(specialCharacters[index]);
           content = content.join(joinText[index]);
           content = content.trim();
       }
    return content;
}

//prevFieldNumber, formName, field
function writeToFile() {
    if(field.fieldNumber != 0){
    console.log(JSON.stringify(field, null, 4));
//    outputFileName =  field.form + "/" + field.title + "Meta.json";
//    fs.writeFile(outputFileName, JSON.stringify(field, null, 4), function(err) {
//        if (err) {
//            return console.log(err);
//        }
//    })
    }
}


//function to clear field properties
function clear(){
    field.fieldNotes = [];
    field.usageNotes = [];
    field.validEntryNotes = [];
    field.validEntry = [];
}