var fs = require('fs');
var field = {};

//read file into a variable
fs.readFile("parsedText.txt", "utf8", function (error, data) {
    if(error){
        console.log(error);
    }
    lines = data;
    parseLine(lines);
});

function parseLine(lines){
    var information = lines.split("\n");
    state = 1; // 1. form, 2. section, 3. field
    var i = 0;
//    while(i<information.length){
//        check for form if state is 1
        state = isForm(information[3]);
//        check for section if state is 2
        state = isSection(information[18]);
        isField(information[19]);
//    }
}


function isForm(line){
    var re = /3(\.).*(.*)[FORM]/;
    if(re.exec(line) != null){
        getFormInfo(line);
        return 2;
    }
    return 1;
}


function isSection(line){
    var re = /3(\.)\d+/;
    if(re.exec(line) != null && line.indexOf("SECTION") > -1){
        getSectionInfo(line);
        return 3;
    }
    return 2;
}


function isField(line){
    var newPage = isNewPage(line);
//    console.log(newPage);
//    if new page, check for form/section/fieldTitle
//    isForm(line);
//    isSection(line);
    getFieldInfo(line);
}


function getFormInfo(line){
    field.form = line.substring(line.indexOf("(")+1, line.indexOf(")"));
    var directory = "./" + field.form;
    if (!fs.existsSync(directory)) {
//        console.log("inform");
//        fs.mkdirSync(directory);
    }
}


function getSectionInfo(line){
    field.section = String(line.match(/[a-zA-Z ]+$/));
    field.section = (field.section.split(" SECTION"))[0];
//    console.log(field.section);
}


function getFieldInfo(line){
    var prevFieldNumber = field.fieldNumber;
    var re = /\d+(\.)\s*[a-zA-Z]+\s*(\-)\s*[a-zA-Z\s]+/;
    if(re.exec(line)){
        field.fieldNumber = String((line).match(/\d+/));
        if(field.fieldNumber != prevFieldNumber+1){
            field.fieldNumber = prevFieldNumber;
            getTitle(line);
            getName(line);
        }
    }else{
        console.log("false");
    }
}


function getTitle(line){
    field.title = String((line.match(/[A-Z]*\s*[-]/)));
    field.title = (field.title.split(" -"))[0];
}


function getName(line){
    field.name = String(line.match(/[-]\s*.*/));
    field.name = (field.name.split("- "))[1];
    console.log(field.name);
}


function isNewPage(line){
    var re = /\d+-\d+$/;
    if(re.exec(line) != null){
        return true;
    }
    return false;
}