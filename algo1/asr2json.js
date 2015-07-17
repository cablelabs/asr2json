var fs = require('fs');

fs.readFile('asr.json', 'utf8', function(err, data) {
    if (err) {
        throw err;
    }
    var json = JSON.parse(data);
    var previous = "version";
    var number = 0;
    var notesflag = 0;  //flag for notes. 1. field notes, 2. Valid entry notes, 3. Usage notes, 4. Example notes.
    var notenumber = 0; //The note number
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
                    console.log("section : ADMIN");
                    }else if(value.indexOf("BILL") > -1){
                    section_flag = 1;
                    console.log("section : BILL");
                    }else if(value.indexOf("CONTACT") > -1){
                    section_flag = 2;
                    console.log("section : CONTACT");
                    }
                    previous = "SECTION";
                  }else if(value.indexOf("NOTE") > -1){
//                    console.log(notesflag + " " +value);
                    notenumber = (value.substring(value.indexOf(" "), value.indexOf("%3A")));
                    previous = "NOTES";
                  }else if(value.indexOf("VALID ENTRIES") > -1){
                    notesflag = 2;
                    previous = "ENTRIES";
                  }else if(value.indexOf("USAGE") > -1){
                    previous = "USE";
                    notesflag = 3;
                  }else if(value.indexOf("DATA CHARACTERISTICS") > -1){
                    previous = "DATA";
                  }else if(value.indexOf("EXAMPLE") > -1){
                    previous = "EX";
                    notesflag = 4;
                  }else if(previous === "ENTRIES"){
//                        console.log("Valid Entry "+number + " " +value);
                  }else if(value.indexOf("-") > -1){
                  //check for fields
//                        if(previous === "SECTION")
//                       var words = value.split(" ");
//                       if(words[words.length-1] === "-"){
//                        console.log("title:" + value);
//                       }
//                        console.log("field number "+previous);
                        console.log("title: " +value + "\n  field number: " +number.slice(0,-1));
                        previous = "TITLE";
                        notesflag = 1;
                    }
                 }else{
                    number = value;
                    }
                 }else if(bold === 0){
//                 console.log(previous);
                    if(previous === "TITLE"){
                      console.log("name: " +value);
                        previous = "NAME";
                    }else if(previous === "NAME" || previous === "DESCRIPTION"){
                      console.log("description: " +value);
                        previous = "DESCRIPTION";
                        notesflag = 1;
                    }else if(previous === "NOTES"){
                      console.log("NOTE: "+notenumber +" " +value);
                    }else if(previous === "ENTRIES"){
                        console.log("Valid Entries " +value);
                    }else if(previous === "USE"){
                        console.log("USAGE: " +value);
                    }else if(previous === "DATA"){
                        console.log("DATA: " +value);
                    }else if(previous === "EX"){
                        console.log("EX: " +value);
                    }
                 }
            }
        }
        previous = "none";
    }
});



//fs.writeFile('myfile.json', 'Hey there!', 'utf8', function(err){
//    if(err){
//        return console.log(err);
//    }
//
//    console.log("File saved!");
//});