
/**********************************
 Require
 **********************************/
var fs               = require ( 'fs' );
var path             = require ( 'path' );
var pdftotext        = require ( 'pdftotextjs' );
var Map              = require ( "collections/map" );
/**********************************
 Global Variables
 **********************************/
var field            = {
    "asogVersion"     : "" ,
    "issueDate"       : "" ,
    "processed"       : "" ,
    "form"            : "" ,
    "section"         : "" ,
    "name"            : "" ,
    "title"           : "" ,
    "fieldNumber"     : "" ,
    "minimumLength"   : "" ,
    "maximumLength"   : "" ,
    "characteristics" : "" ,
    "usage"           : "" ,
    "example"         : "" ,
    "examples"        : "" ,
    "definition"      : "" ,
    "validEntry"      : "" ,
    "validEntryNotes" : "" ,
    "usageNotes"      : "" ,
    "fieldNotes"      : "" ,
    "exampleNotes"    : ""
};
field.fieldNumber    = 0;
var fileContent      = [];       //text from the file written by consolidator
field.keywordFlag = false;     //if the keyword is encountered
var state              = 0;
field.nextForm         = "";
field.nextSection      = "";
var outputDir          = '';
var previousValidEntry = false;
function mkdir ( path ) {
    if ( !fs.existsSync ( path ) ) {
        fs.mkdirSync ( path );
    }
}

runAsr2Json.apply ( null , process.argv.slice ( 2 ) );

// Retrieve data from pdf with layout for further processing.
function runAsr2Json ( pathToPDF , outputPath , startPageNo , endPageNo ) {
    var args          = Array.prototype.slice.call ( arguments );
    var missingParams = [ 'pathToPDF' , 'outputPath' , 'startPageNo' , 'endPageNo' ].filter (
        function ( param , i ) {
            return ( typeof args[ i ] === 'undefined');
        }
    );
    if ( missingParams.length ) {
        throw new Error ( [ 'asr2json is missing parameter' + (missingParams.length > 1 ? 's' : '') , ' ' + missingParams.join ( ', ' ) ].join ( '' ));
    }
    else {
        outputDir      = outputPath;
        var tmpDirPath = __dirname + '/temp';
        mkdir ( outputPath );
        mkdir ( tmpDirPath );
        asyncPdf = new pdftotext ( pathToPDF );
        asyncPdf.add_options ( [ '-f ' + startPageNo , '-l ' + endPageNo , '-layout' ] );
        asyncPdf.getText (
            function ( err , obtainedData , cmd ) {

                if ( err ) {
                    console.error ( '\n Error :' + err );
                }
                else {
                    var writablestream = fs.createWriteStream ( 'temp/asyncAsrOutputTxt' );
                    writablestream.write ( obtainedData );
                    writablestream.end ();
                    writablestream.on ( 'finish' , function () {
                                            // do stuff
                                            read ();

                                        }
                    );

                }
            }
        );

    }};

/**
 * Read the stream
 */
function read () {
    var readableStream = fs.createReadStream ( 'temp/asyncAsrOutputTxt' );
    var data           = ' ';
    readableStream.setEncoding ( 'utf8' );
    readableStream.on (
        'data' , function ( chunk ) {
            data = data + chunk;
        }
    );
    readableStream.on (
        'end' , function () {
            fileContent = data.split ( "\n" );
            clear ();
            processedAt ();          //store the processing date-time
            for ( var i = 0 ; i < fileContent.length ; i++ ) {
                parseLine ( fileContent[ i ].trim () );
                if ( i == fileContent.length - 1 ) { //for the last field
                    getDescription ( field.content );
                    writeToFile ();
                }
            }
        }
    );
}


/**
 * Process the pdf, line by line.
 */
function parseLine ( lines ) {
    if ( state == 0 ) {
        isForm ( lines );
        isSection ( lines );
        isField ( lines );
    }
    else if ( state == 1 ) {
        isSection ( lines );
    }
    else if ( state == 2 ) {
        isField ( lines );
    }
    else if ( state == 3 ) {
        getFieldInfo ( lines );
    }
}


/**
 * Check if the line indicates the start of a form.
 */
function isForm ( line ) {
    var re = /^3\./;    //Change the formNumber according to the formNumber on the pdf
    if ( re.exec ( line ) != null && line.indexOf ( "FORM" ) > -1 ) {
        getFormInfo ( line );
        state = 1;
        return true;
    }

    return false;
}


/**
 * Check if the line indicates the start of a section.
 */
function isSection ( line ) {
    var re = /^3\.\d/;
    if ( re.exec ( line ) != null && line.indexOf ( "SECTION" ) > -1 ) {
        getSectionInfo ( line );
        state = 2;
        return true;
    }

    return false;
}


/**
 * Check if the line indicates the start of a field.
 */
function isField ( line ) {
    var re        = /^\d+\.\s*[A-Z].*/;
    var titleLine = line.replace ( /\s/g , "" );
    var reg       = /^\d+\. [A-Z].*/
    if ( re.exec ( titleLine ) != null || reg.exec ( titleLine ) != null ) {
        field.subSuperScript = new Map ();
        getFieldInfo ( line );
        state = 3;
        return true;
    }

    return false;
}


/**
 * Get the form name and create a directory with the name, if there is none created
 */
function getFormInfo ( line ) {
    field.nextForm = line.substring ( line.indexOf ( "(" ) + 1 , line.indexOf ( ")" ) );
    field.nextForm = field.nextForm.replace ( "/" , ":" );
}


/**
 * Get the section name
 */
function getSectionInfo ( line ) {
// Get section number and use it to find if the next 3.x is section number + 1
    field.nextSection = String ( line.match ( /[a-z.*A-Z ]+$/ ) );
    field.nextSection = (
        field.nextSection.split ( " SECTION" )
    )[ 0 ].trim ();
}


/**
 * Get the field info and add in the field object
 */
function getFieldInfo ( line ) {
    var prevFieldNumber = field.fieldNumber;    //store the previous fieldNumber
    var previous = field.previousField;     //store the previous field
    var lineConsidered = 0;                     //if the line is already considered
    var newPage = isNewPage ( line );


    if ( line.match ( /^ATIS.*/ ) != null ) {   //ignore the lines
        previous = "";
        getVersion ( line );       //use atis for the version number
        state = 0;              //new page, search for form, section, field
    }

    // Added to process any last field information.
    if ( newPage ) {    //ignore the line number, use it to store the info as no other keyword will be seen
        getDescription ( field.content );
        field.content = "";
        previous      = "";
    }


    // Detect if current line contains title and name of a field.
    var re = /^\d+(\.).*/;
    if ( re.exec ( line ) ) {
        if ( line.indexOf ( "-" ) > -1 || line.indexOf ( "–" ) > -1 ) {
            field.fieldNumber = String ( (line).match ( /\d+/ ) );
            if ( prevFieldNumber == field.fieldNumber - 1 ) {
                if ( field.form == "" ) {
                    field.form    = field.nextForm;
                    field.section = field.nextSection;
                }
                lineConsidered    = field.fieldNumber;
                field.fieldNumber = prevFieldNumber;
                writeToFile ();
                clear ();
                field.form        = field.nextForm;
                field.section     = field.nextSection;
                field.fieldNumber = lineConsidered;
                getTitle ( line );
                field.previousField = "field";
                lineConsidered      = 1;
            }
            else {
                prevFieldNumber = field.fieldNumber;
                // Added to retrieve title
                if ( field.title == "" && field.name == "" ) {
                    getTitle ( line );
                }
                previous = "";
            }
        }
    }

    // Check if current line contains a keyword
    field.keywordFlag = checkKeyword ( line );
    if ( field.keywordFlag != false ) {
        getDescription ( field.content );
        field.content = "";
        getKeyword ( line );

    }
    else if ( field.keywordFlag === false ) {

        if ( isIgnoreLine ( line ) ) {
            //console.log( '\n Do nothing.' );
        }
        else {

            // Added to retrieve definition of a field.
            if ( field.previousField === "field" && line != "" ) {
                getDefinition ( line );

            }

            // Added to retrieve field notes without NOTE keyword.
            if ( field.previousField == "fieldNotes" && line != "" ) {
                field.content = field.content + " " + line;

            }
            // Added to retrieve valid entry lines without keyword
            if ( field.previousField === "valid entry" && field.previousField != "validEntryNotes" && line != "" ) {

                // Added to handle entries of the form ( sub and superscript ) in valid entry
                if ( isSubSuperscript ( line ) && line.indexOf ( "=" ) == -1 ) {
                    field.subSuperScript.set( line.trim() , line.trim() );
                    field.content = field.content + " " + line + "\n";
                }

                // Added to handle entries of the form  ( key = value )  in valid entry
                if ( line != "" && line.indexOf( "=" ) > -1 && isSubSuperscript ( line ) === false ) {
                    field.content = field.content + " " + line + "\n";
                }
                // Added to handle all other entries in valid entry
                if ( line != "" && line.indexOf( "=" ) == -1 && isSubSuperscript ( line ) === false ) {
                    field.content = field.content + " " + line + "\n";
                }

            }
            // Added to retrieve valid entry notes without NOTE keyword.
            if ( field.previousField === "validEntryNotes" && line != "" && isNewPage ( line ) === false ) {

                // Added to detect a Valid Entry which is of the form ( subscript / superscript ) after NOTE keyword
                if ( isSubSuperscript ( line ) && line.indexOf ( "=" ) == -1 ) {
                    field.subSuperScript.set( line.trim() , line.trim() );

                    // Store previous notes if any
                    if ( field.content != "" ) {
                        getDescription ( field.content )
                        field.content = "";
                    }
                    field.content       = field.content + " " + line + "\n";
                    field.previousField = "valid entry";
                }

                // Added to detect a Valid Entry which is of form ( key = value ) after NOTE keyword.
                if ( line.indexOf( "=" ) > -1 && isSubSuperscript ( line ) == false ) {

                    //Added conditions to prevent false identification of valid entires.
                    if ( (line.indexOf( "(" ) == -1 && line.indexOf( "“" ) == -1 && line.indexOf( "”" ) == -1 && line.indexOf( ")" ) == -1) ) {

                        // Store previous notes if any
                        if ( field.content != "" ) {
                            getDescription ( field.content )
                            field.content = "";
                        }
                        field.content       = field.content + " " + line + "\n";
                        field.previousField = "valid entry";

                    }
                    else {
                        field.content = field.content + " " + line;
                    }
                }
                // Added to process a valid entry note without the NOTE keyword
                if ( isSubSuperscript ( line ) === false && line.indexOf ( "=" ) == -1 && line != "" ) {
                    field.content = field.content + " " + line;
                }


            }
            // Added to retrieve usageNotes  without keyword.
            if ( field.previousField === "usageNotes" && line != "" ) {
                field.content = field.content + " " + line;

            }

            // Added to retrieve exampleNotes  without keyword.
            if ( field.previousField === "exampleNotes" && line != "" ) {
                field.content = field.content + " " + line;

            }


            // Added to detect multiple examples lines without Examples keyword
            if ( isNewPage ( line ) === false ) {
                if ( line.match ( /^EXAMPLES:.*/ ) === null && field.previousField == "examples" && line != "" ) {
                    getExample ( line );
                }
            }
        }
    }

}

function isSubSuperscript ( line ) {

    var subSuperscriptRegex = /\d{1,2}[a-z][a-z]\s+(Character)|(Position)|(Positions)/
    if ( subSuperscriptRegex.exec( line ) != null ) {
        return true;
    }

    return false;
}

/**
 * Retrieve title and name of a field
 */
function getTitle ( line ) {

    // Need a fix to not change the field.previousField in case of multiple page fields.
    var re = /\d+\.s*([A-Z]+[\–\-][A-Z\–\-\s*]+?)([A-Z][a-z].*)/;

    if ( re.exec ( line ) ) {         //More than one hyphen
        var title   = re.exec ( line );
        field.title = title[ 1 ].trim ().replace ( /[\–\-]$/ , "" );
        field.name  = title[ 2 ];
    }
    else {                                         //Only one hyphen
        var reg     = /[0-9]+\.(.*)[\-\–](.*)/;
        field.title = reg.exec ( line )[ 1 ].trim ();
        field.name  = reg.exec ( line )[ 2 ].trim ();
        if ( line.indexOf ( "(" ) > -1 && line.indexOf ( ")" ) > -1 ) {
            field.title = field.title + " " + line.substring ( line.indexOf ( "(" ) + 1 , line.indexOf ( ")" ) );
        }
    }

    if ( field.name != null && field.title != null ) {
        field.previousField = "field";

    }
}


/**
 * Check for keyword in the line
 */
function checkKeyword ( line ) {
    line   = line.trim ();
    var re = /^(NOTE)s*/;


    if ( line.match ( /^VALID ENTRIES:.*/ ) != null || line.match ( /^VALID ENTRIES.*:/ ) != null || line.match ( /^USAGE:.*/ ) != null || line.match ( /^DATA CHARACTERISTICS:.*/ ) != null || line.match ( /^EXAMPLE:.*/ ) != null || line.match ( /^EXAMPLES:.*/ ) != null ) {
        return true;
    }

    if ( re.exec ( line ) != null ) {
        return true;
    }

    return false;
}

/**
 * Return the version from the line
 */
function getVersion ( line ) {
    var re = /^(ATIS)+(\-)\d+(\-)\d+/;
    if ( re.exec ( line ) ) {
        var words         = line.split ( " " );
        field.asogVersion = words[ 0 ].substring ( words[ 0 ].length - 4 , words[ 0 ].length );
        field.issueDate   = words[ words.length - 3 ] + " " + words[ words.length - 2 ] + " " + words[ words.length - 1 ]
    }
}

// Return true if line match ignore criteria
function isIgnoreLine ( line ) {
    line = line.trim();


    var atisReg           = /^(ATIS)+(\-)\d+(\-)\d+\s+(Effective)\s+/;
    var issueDateReg      = /^Issued\s+\w+\s+\d+\,\s+\d{4}\s+(Implemented)\s+\w+\s+\d{1,2}\,\s+\d{4}/
    var fieldContinuation = field.name + ' (continued)';

    if ( atisReg.exec( line ) != null ) {
        return true;
    }
    if ( issueDateReg.exec( line ) != null ) {
        return true;
    }

    if ( isNewPage ( line ) ) {
        return true;
    }
    if ( line.indexOf( fieldContinuation ) > -1 ) {
        return true;
    }

    return false;
}

/**
 * Store processing information (Date-time)
 */
function processedAt () {
    field.processed = new Date ();
}


/**
 * Retrieve definition info
 */
function getDefinition ( line ) {

    if ( line.indexOf( field.fieldNumber ) === -1 ) {
        field.definition = field.definition + " " + line;
    }


}


/**
 * Retrieve the keyword. The lines following will be the description for the keyword
 */
function getKeyword ( line ) {
    line    = line.trim ();
    var re  = /^(NOTE)s*/;
    var reg = /^(NOTE)s*\d+:/;
    if ( re.exec ( line ) != null ) {
        switch ( field.previousField ) {
            case "field":
            case "fieldNotes":
                field.previousField = "fieldNotes";
                getNotes ( line );
                break;
            case "valid entry":
            case "validEntryNotes":
                field.previousField = "validEntryNotes";
                getNotes ( line );
                break;
            case "usage":
            case "usageNotes":
                field.previousField = "usageNotes";
                getNotes ( line );
                break;
            case "example":
            case "exampleNotes":
                field.previousField = "exampleNotes";
                getNotes ( line );
                break;
            case "examples":
            case "exampleNotes":
                field.previousField = "exampleNotes";
                getNotes ( line );
                break;
            default:
        }
    }
    else if ( line.match ( /^VALID ENTRIES:.*/ ) != null || line.match ( /^VALID ENTRIES.*:/ ) ) {
        field.previousField = "valid entry";
    }
    else if ( line.indexOf ( "USAGE" ) > -1 ) {
        field.previousField = "usage";
        field.content       = field.content + " " + line;

    }
    else if ( line.indexOf ( "DATA CHARACTERISTICS" ) > -1 ) {
        field.previousField = "data";
        field.content       = field.content + " " + line;


    }
    else if ( line.match ( /^EXAMPLES:.*/ ) != null ) {
        field.previousField = "examples";
        getExample ( line );

    }
    else if ( line.match ( /^EXAMPLE:.*/ ) != null ) {
        field.previousField = "example";
        getExample ( line );
    }

}

/**
 * Extract notes if the keyword's on the same line
 */
function getNotes ( line ) {
    line = (line.substring ( line.indexOf ( ":" ) + 1 , line.length )).trim ();
    if ( line != " " ) {
        line          = line.replace ( /\n/g , " " );
        field.content = field.content + " " + line;
        field.content = field.content.replace( /\s+/g , ' ' )
    }

}

/**
 * Retrieve description and store in the respective keywords in the field object
 */
function getDescription ( line ) {
    var re = /^3-\d+$/;
    if ( re.exec ( line ) == null && line != "" ) {
        line = line.trim ();
        switch ( field.previousField ) {
            case "fieldNotes":
                line = line.replace ( /\n/g , " " );
                field.fieldNotes.push ( line );
                break;
            case "validEntryNotes":
                line = line.replace ( /\n/g , " " );
                field.validEntryNotes.push ( line );
                break;
            case "usageNotes":
                line = line.replace ( /\n/g , " " );
                field.usageNotes.push ( line );
                break;
            case "exampleNotes":
                line = line.replace ( /\n/g , " " );
                field.exampleNotes.push ( line );
                break;
            case "valid entry":
                processValidEntry ( line );
                break;
            case "data":
                line = line.replace ( /\n/g , " " );
                getLength ( line );
                break;
            case "example":
                getExample ( line );
                break;
            case "examples":
                getExample ( line );
                break;
            case "usage":
                if ( line.indexOf ( "required" ) > -1 ) {
                    field.usage = "Required";
                }
                else if ( line.indexOf ( "conditional" ) > -1 ) {
                    field.usage = "Conditional";
                }
                else if ( line.indexOf ( "optional" ) > -1 ) {
                    field.usage = "Optional";
                }
                break;
            default:
        }
    }
}


/**
 * Retrieve valid entry information for a field
 */
function processValidEntry ( line ) {
    line                         = line.trim ();
    var entries                  = line.split ( "\n" );
    var item                     = [] , startProcessingIndex = 0;
    var validEntryDescriptionMap = new Map ();

    // Added to prevent data loss in multiple types of Valid Entries
    for ( var entryCounter = 0 ; entryCounter < entries.length ; entryCounter++ ) {
        var currentEntry = entries[ entryCounter ];
        if ( currentEntry.indexOf ( "=" ) > -1 && isSubSuperscript ( line ) === false ) {
            startProcessingIndex = entryCounter;
            break;
        }

    }

    if ( startProcessingIndex > 0 && startProcessingIndex != -1 ) {

        for ( var entryCounter = 0 ; entryCounter < startProcessingIndex ; entryCounter++ ) {
            var currentEntry = entries[ entryCounter ];
            if ( isSubSuperscript ( currentEntry ) === false ) {
                field.validEntry.push( { value : "" , description : currentEntry } );
            }
        }

    }


    // Populate Valid Entries in fields which are of the form ( subscript / superscript )
    for ( var entryCounter = 0 ; entryCounter < entries.length ; entryCounter++ ) {

        var currentEntry = entries[ entryCounter ];
        // Populate Subscripts and Superscript entries in valid entry
        if ( currentEntry == (field.subSuperScript.get( currentEntry )) ) {
            field.validEntry.push( { value : currentEntry , description : "" } );

        }

    }


    // Added to process single / multiple line valid entries of form ( key = value )
    for ( var entryCounter = 0 ; entryCounter < entries.length ; entryCounter++ ) {
        var currentEntry = entries[ entryCounter ];
        if ( currentEntry.indexOf ( "=" ) > -1 ) {
            validEntryDescriptionMap.set( currentEntry.split ( "=" )[ 0 ].trim () , entryCounter )
        }
    }
    var descriptionKeys    = validEntryDescriptionMap.keys();
    var descriptionIndexes = validEntryDescriptionMap.values();
    for ( var i = 0 ; i < descriptionKeys.length ; i++ ) {

        item.push( { key : descriptionKeys [ i ] , startIndex : descriptionIndexes [ i ] , endIndex : descriptionIndexes [ i + 1 ] } );

    }

    // No entries of the form ( key = value ) present
    if ( descriptionKeys.length === 0 && descriptionIndexes.length === 0 && item.length === 0 ) {

        var description = "";
        for ( var entryCounter = 0 ; entryCounter < entries.length ; entryCounter++ ) {
            description = description + entries[ entryCounter ];

        }

        if ( description != "" ) {
            field.validEntry.push( { value : "" , description : description } );
        }
    }
    else {

        // Populate Valid Entries in fields which are of the form ( key = value )
        for ( var itemCounter = 0 ; itemCounter < item.length ; itemCounter++ ) {
            var value             = item[ itemCounter ].key;
            var description       = "";
            var currentStartIndex = item[ itemCounter ].startIndex;
            var currentEndIndex   = item[ itemCounter ].endIndex;

            // Added to process last single/multi-line valid entry in form ( key = value ) without currentEndIndex
            if ( currentEndIndex === undefined ) {
                //console.log( '\n No end index.Processing last entry in valid entires' );
                currentEndIndex = entries.length - 1;
                if ( currentStartIndex === currentEndIndex ) {
                    if ( entries[ currentStartIndex ].indexOf ( "=" ) > -1 ) {
                        description = description + entries[ currentStartIndex ].split ( "=" )[ 1 ].trim ()
                    }
                    else {
                        description = description + entries[ currentStartIndex ];
                    }
                }
                else {
                    for ( var j = currentStartIndex ; j <= currentEndIndex ; j++ ) {
                        if ( entries[ j ].indexOf( "=" ) > -1 ) {
                            description = description + entries[ j ].split ( "=" )[ 1 ].trim ()

                        }
                        else {
                            description = description + entries[ j ];
                        }
                    }
                }

                if ( value != undefined && description != "" ) {
                    field.validEntry.push( { value : value , description : description } )

                }

            }
            else {
                // Added to obtain single / multi-line description of a valid entry of the form ( key = value )
                for ( var dIndex = item[ itemCounter ].startIndex ; dIndex < item[ itemCounter ].endIndex ; dIndex++ ) {
                    if ( entries[ dIndex ].indexOf( "=" ) > -1 ) {
                        description = description + entries[ dIndex ].split ( "=" )[ 1 ].trim ()
                    }
                    else {
                        description = description + entries[ dIndex ];
                    }


                }
                if ( value != undefined && description != "" ) {
                    field.validEntry.push( { value : value , description : description } )

                }
            }
        }
    }

}


/**
 * Retrieve the minimum and maximum length for the field
 */
function getLength ( line ) {
    line = line.trim ();
    if ( (line.match ( "maximum" ) == null) && (line.match ( "minimum" ) == null) ) {
        var values = line.split ( ":" );
        for ( var j = 0 ; j < values.length ; j++ ) {

        }
        for ( var i = 0 ; i < values.length ; i++ ) {
            getLengthValues ( values[ i ] );
        }
    }
    else {
        field.minimumLength = "";
        getLengthValues ( line );
    }
}


/**
 * Retrieve the characteristics and length if only one data value is specified
 */
function getLengthValues ( line ) {
    line       = line.trim ();
    var values = line.split ( " " );
    if ( values.length > 1 && line.indexOf ( "minimum" ) > -1 ) {
        field.minimumLength = values[ 0 ];
    }
    else if ( values.length > 1 ) {
        field.maximumLength = values[ 0 ];
    }
    if ( line.indexOf ( "alpha" ) > -1 ) {
        field.characteristics = "Alpha";
        if ( line.indexOf ( "numeric" ) > -1 ) {
            field.characteristics = "AlphaNumeric";
        }
    }
    else if ( line.indexOf ( "numeric" ) > -1 ) {
        field.characteristics = "Numeric";
    }
}

/**
 * Retrieve the examples specified in field.
 */
function getExample ( line ) {
    line = line.trim ();

    if ( line.match ( /^EXAMPLES:.*/ ) != null ) {
        line       = line.replace ( /\s/g , '' )
        var values = line.split ( ":" );
        if ( values.length > 1 ) {
            field.examples.push ( values[ 1 ].trim () );
        }

    }

    if ( line.match ( /^EXAMPLE:.*/ ) != null ) {
        line       = line.replace ( /\s/g , '' )
        var values = line.split ( ":" );
        if ( values.length > 1 ) {
            field.example = values[ 1 ].trim ();
        }
    }


    if ( ( (line.match ( /^EXAMPLES:.*/ ) === null) && field.previousField == "examples") ) {
        if ( isNewPage ( line ) === false ) {
            line = line.replace ( /\s/g , '' )
            if ( field.examples ) {
                if ( ( ( line.length >= 1 && line.length <= field.maximumLength ) && line != null && line != "") ) {
                    field.examples.push ( line.trim () );
                }
            }
        }
        else {
            if ( isNewPage ( line ) === true ) {
                previous = "";

            }
        }

    }
}

/**
 * Check if the line indicates the start of a new page
 */
function isNewPage ( line ) {
    var re = /^3-\d+$/;
    if ( re.exec ( line ) != null ) {
        return true;
    }
    return false;
}


/**
 * Initialize and clear previous values stored
 */
function clear () {
    field.previousField   = "";
    field.definition      = "";
    field.example         = "";
    field.content         = "";
    field.asogVersion     = "";
    field.issueDate       = "";
    field.examples        = [];
    field.fieldNotes      = [];
    field.usageNotes      = [];
    field.validEntryNotes = [];
    field.validEntry      = [];
    field.exampleNotes    = [];
}


/**
 * Write the output to the file
 */
function writeToFile () {
    var title = field.title;
    title     = title.replace ( '/' , ':' );
    if ( parseInt ( field.fieldNumber , 10 ) !== 0 ) {
        //console.log(JSON.stringify(field, replacer, 4));
        var formPath = path.join ( outputDir , field.form );

        mkdir ( formPath );

        var fieldPath = formPath + '/' + title + ".json";
        //console.log ( '\n FieldPath : ' + fieldPath + '\t fieldNumber : ' + field.fieldNumber )
        fs.writeFile (
            fieldPath , JSON.stringify ( field , replacer , 4 ) , function ( err ) {
                if ( err ) {
                    return console.log ( err );
                }
            }
        );
    }
}


/**
 * Replace the keys that should not be displayed/written to a file
 * example is removed as the format is not right
 */
function replacer ( key , value ) {
    if ( key == "keywordFlag" || key == "previousField" || key == "content" || key == "issueDate" || key == "nextSection" || key == "nextForm" || key == "subSuperScript" ) {
        return undefined;
    }
    return value;
}

