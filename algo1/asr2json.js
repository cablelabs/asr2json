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
        field.fieldNumber = processPage(texts,field.fieldNumber);
        previous = "none";
    }
});


//function to process the page and fine the definitions in the json file page by page
function processPage(texts,fieldNumber){
    var previous = " ";
    var content = " ";
    var number = 0;
    var notesflag = 0;  //flag for notes. 1. field notes, 2. Valid entry notes, 3. Usage notes, 4. Example notes.
//    var notenumber = 0; //The note number
    var section_flag = "";        // flag to indicate the section for the field (admin, bill, contact)
    for( var j = 0; j<texts.length; j++) {
        var R = texts[j]["R"];
        for( var k = 0; k<R.length; k++) {
            var value = R[k]["T"];
            var TS = R[k]["TS"];
//            console.log(j+ " " +TS[2] + " " + value);

            var bold = TS[2];
            value = decodeURI(value);
//                console.log(j+ " " +bold + " " + value);
           if(bold === 1){
            //bold and not a keyword
            if(isNaN(value)){
            //call to split data characteristics
                getFormat(previous,content);
                printContent(previous,content);
                content = " ";
                if(value.indexOf("FORM") > -1){           //keyword form
//                    fs.mkdirSync(value);
//                    console.log(" ASR" + value);
                    previous = "form";
                }else if(value.indexOf("SECTION") > -1){   //keyword section
//                    Checks to find the section for the fields
                    section_flag = value.substring(0,(value.indexOf("SECTION")));
                    content = content + section_flag;
//                    console.log(content);
                    previous = "SECTION";
                }else if(value.indexOf("NOTE") > -1){
//                    console.log(notesflag + " " +value);
//                    notenumber = (value.substring(value.indexOf(" "), value.indexOf("%3A")));
                    previous = "NOTES";
                }else if(value.indexOf("VALID ENTRIES") > -1){
                    notesflag = 2;
                    previous = "VALID ENTRIES";
                }else if(value.indexOf("USAGE") > -1){
                    previous = "USAGE";
                    notesflag = 3;
                }else if(value.indexOf("DATA CHARACTERISTICS") > -1){
                    previous = "DATA";
                }else if(value.indexOf("EXAMPLE") > -1 || value.indexOf("EXAMPLES") > -1){
                    previous = "EXAMPLE";
                    notesflag = 4;
                }else{
                    if(previous === " " || previous === "SECTION"){
//                        check for fields
                        var num = parseInt(number);
                        if(num === (fieldNumber+1)){
                            previous = "TITLE";
                            value = getTitle(value);
                            fieldNumber = num;
                            printContent(previous,value);
                        }
                        printContent("fieldnumber",number);
                        notesflag = 1;
                    }else if(previous === "VALID ENTRIES"){ //use that flag for the notes and this will be handled
                        previous = "VALID ENTRIES";
                        console.log("Extra " +value + " previous "+previous);
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
                if(previous === "TITLE"){
                    if(value.indexOf("(continued)") < -1){
                        previous = "NAME";
                        printContent(previous,value);
                    }
                }else if(previous === "NAME" || previous === "DEFINITION"){
                    content = content + value;
//                    console.log("definition: " +value);
                    previous = "DEFINITION";
//                    content = content + value;
                    notesflag = 1;
                }else if(previous === "NOTES"){
                    content = content + value;
//                    console.log(previous +"NOTE: "+notenumber +" " +value);
                }else if(previous === "VALID ENTRIES"){
                    content = content + value;
//                    console.log(previous +"Valid Entries " +value);
                }else if(previous === "USAGE"){
                    content = content + value;
//                    console.log(previous +"USAGE: " +value);
                }else if(previous === "DATA"){
                    content = content + value;
//                    console.log(previous +"DATA: " +value);
                }else if(previous === "EXAMPLE"){
                    content = content + value;
//                    console.log(previous +"EX: " +value);
                }
            }
        }
    }
    printContent(previous,content);
    return fieldNumber;
}

//format the description based on the tag
function getFormat(previous,content){
    if(previous === "DATA"){
        getLength(content);
    }else if(previous === "VALID ENTRIES"){
//        formatValidEntries(content);
    }
}


//function to convert valid entries to value/description format
//function formatValidEntries(content){
//}



//function to get field length and characteristics
function getLength(content){
    var values = content.trim();
    values = values.split(" ");
//    console.log("fieldLength: " + values[0]);
    if(values[1] === "alpha"){
        console.log("characteristics: Alpha");
    }else if(values[1] === "numeric"){
        console.log("characteristics: Numeric");
    }else if(values[1].indexOf("%2F") > -1){
        console.log("characteristics: AlphaNumeric");
    }
}


//extract the title, field number
function getTitle(content){
    var title = " ";
//    console.log(content);
    if(content.indexOf(".") > -1){
        var values = content.replace(/-/g,'');
        //check for field number, if it exists then ignore
        title = title + values;
    }else{
//        console.log(content);
        return content;
    }
//    console.log(title);
    return title.substring(0,title.length-1);
}


//print the definition read in the json file
function printContent(previous,content){
    if(previous === " " && content === " "){
    }else if(content != " "){
        content = convertToText(content);
        console.log(previous + ": " + content);
    }
}


//function to convert the special characters in text
//returns the converted text
function convertToText(content){
    var specialCharacters= [ "T\n", "\n", "%20", "%26", " b y ", " o f ", " w ithin ", " NOTE ", "%2C", "%E2%80%9C", "%E2%80%9D", "%E2%80%99", "%2F", "%3A ", "2%3A ", "3%3A ", "4%3A ", "5%3A ", "6%3A ", "7%3A ", " %3D " ];
    var joinText = [ "T", "  ", " ", " & " , " by ", " of ", " within ", "", ",", "\"", "\"", "\'", "/", ":\n", "\n", "\n", "\n", "\n", "\n", "\n", "=" ];
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