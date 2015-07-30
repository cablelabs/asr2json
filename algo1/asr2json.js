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

}