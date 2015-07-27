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
        console.log("\n");
    }
});


//function to process the page and retrieve the definitions in the json file page by page
function processPage(texts,field){
    var previous = " ";
    var content = " ";
    var number = 0;
    var notesFlag = " ";  //flag for notes.  field notes,  Valid entry notes,  Usage notes,  Example notes.
//    var noteNumber = 0; //The note number
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
//                    fs.mkdirSync(value);
//                    console.log(" ASR" + value);
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
                        var num = (parseInt(number) != (field.fieldNumber+1) ? getFieldNumber(value) : parseInt(number));
                        if(num === (field.fieldNumber+1)){
                            previous = "title";
                            field.fieldNumber = num;
                            value = getTitle(value);
                            console.log("processed: " +new Date());
                            printContent("form", field.form);
                            printContent("section",field.section);
                            printContent(previous,value);
                            printContent("fieldNumber",number);
                        }
                        notesFlag = "field";
                    }else{
                        if(value != "-"){
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
                number = value;
            }
//            If the string is not in bold
//              Have to check for not bold after continued appears
           }else if(bold === 0){
//                 console.log(previous);
                if(previous === "title"){
                    previous = "name";
                    printContent(previous,value);
                }else if(previous === "name" || previous === "definition"){
                    content = content + value;
//                    console.log("definition: " +value);
                    previous = "definition";
//                    content = content + value;
                    notesFlag = "field";
                }else if(previous != " "){
                    content = content + value;
                }else if(previous === "form"){
                    //ignore the form description
                }
            }
        }
    }
    field.previous = previous;
    printContent(field.previous,content);           //for examples
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
    printContent("fieldLength",values[0]);
//    console.log("fieldLength: " + values[0]);
    if(values[1] === "alpha"){
        field.characteristics = "Alpha";
//        console.log("characteristics: Alpha");
    }else if(values[1] === "numeric"){
        field.characteristics = "Numeric";
//        console.log("characteristics: Numeric");
    }else if(values[1].indexOf("%2F") > -1){
        field.characteristics = "AlphaNumeric";
//        console.log("characteristics: AlphaNumeric");
    }
    return field.characteristics;
}


//extract the title, field number
function getTitle(content){
    var title = " ";
    var values = content.replace(/ |-/g,'');
//    console.log(content);
    if(content.indexOf(".") > -1){
        var num = values.substring(0,values.indexOf("."));
        values = values.substring((values.indexOf(".")+1),values.length);
        //check for field number, if it exists then ignore
        title = title + values;
    }else{
        return values;
    }
    return title;
}


//print the definition read in the json file
function printContent(previous,content){
    if(previous === " " && content === " "){
    }else if(content != " "){
        if(previous != "data"){
        content = convertToText(content);
        }else if(previous === "data"){
            content = getLength(content);
            previous = "characteristics";
        }
        console.log(previous + ": " + content); //write to a file
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
       }
    return content;
}


//function to write the definitions in a separate file
//fs.writeFile('myfile.json', 'Hey there!', 'utf8', function(err){
//    if(err){
//        return console.log(err);
//    }
//
//    console.log("File saved!");
//});