var fs = require('fs');

fs.readFile('asr.json', 'utf8', function(err, data) {
    if (err) {
        throw err;
    }
    var json = JSON.parse(data);
    var previous = "version";
    var content = " ";
    var section_flag = 0;        // flag to indicate the section for the field ( 0 = admin, 1 = bill, 2 = contact)
    for( var i = 0; i<json.formImage["Pages"].length; i++) {
        var texts = json.formImage["Pages"][i]["Texts"];
        for( var j = 0; j<texts.length; j++) {
            var R = texts[j]["R"];
            for( var k = 0; k<R.length; k++) {
                var value = R[k]["T"];
                var TS = R[k]["TS"];
//                console.log(j+ " " +TS[2] + " " + value);


                var bold = TS[2];
                value = decodeURI(value);
//                console.log(j+ " " +bold + " " + value);
                if(bold === 1){
                //bold and not a keyword
                 if(isNaN(value)){
                  //This is a new form so create a new folder for the form
                  if(value.indexOf("FORM") > -1){           //keyword form
//                    fs.mkdirSync(value);
//                    console.log(" ASR" + value);
                    previous = "form";
                  }else if(value.indexOf("SECTION") > -1){   //keyword section
                    //Checks to find the section for the fields
                    if(value.indexOf("ADMINISTRATIVE") > -1){
                    section_flag = 0;
//                    console.log("section : ADMIN");
                    }else if(value.indexOf("BILL") > -1){
                    section_flag = 1;
//                    console.log("section : BILL");
                    }else if(value.indexOf("CONTACT") > -1){
                    section_flag = 2;
//                    console.log("section : CONTACT");
                    }
                    previous = "SECTION";
                  }else{
                    //check for fields
                    if(value.indexOf("-") > -1){
//                       var words = value.split(" ");
//                       if(words[words.length-1] === "-"){
                        console.log(j + "title:" + value);
//                       }
                    }
                  }
                 }else{
                    //check for field/note number
                    if(isNaN(value.slice(-1))){ //1. / 1:
                    //field number/note number
                        previous = value.substring(0,value.length-1);

                        }else{  //3.1
                            previous = value;
                        }
                    }
                 }
            }
        }
    }
});



//fs.writeFile('myfile.json', 'Hey there!', 'utf8', function(err){
//    if(err){
//        return console.log(err);
//    }
//
//    console.log("File saved!");
//});