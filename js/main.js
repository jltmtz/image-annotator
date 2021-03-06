/* 
*  General Notes: 
*  Note we take x as horizontal --- This has been the biggest confusion so far for me working with images 
*
*  attributes of annotation so far .. 
*  img
*  flow
*  data
*       array of parts object
*           parts object has following attr 
*               x,y,interp
*                   x,y are the coordinates
*                   interp is true if the coordinates are found by prediction 
*                   algorithms else it is false
*/
        
/* 
*  Global Variables --- comes from specific files
*  All the variables the user need to set should be on the top
*/
var img_path        = 'imgs/undercam/cam1logfile1/cam1logfile1_%05d.jpeg';
var flow_path       = 'flow/undercam/cam1logfile1/cam1logfile1_%05d.jpeg';
var nimages         = 100;              //TODO: This could be determined automatically    
var FPS             = 10;               // Playing speed; TODO: Provide UI to change it

// control_points are the keypoints
// control_attr are the attributes applied to control points in different states. 
// States are mouseover, interp (true), default (interp = false)
var control_points  = ["head","body","larm","rarm","tail","lleg","rleg","mtail","etail"];
var control_attr    = {"mouseover"  : {fill: "#FF8000", stroke: "none", opacity:0.5, r:10},
                       "interp"     : {fill: "#FF0000", stroke: "none", opacity:0.5, r:5 },
                       "default"    : {fill: "#00FF80", stroke: "none", opacity:0.5, r:5}};

// Connections is where to draw the line
var connections     =
["head-body","body-larm","body-rarm","body-tail","tail-lleg","tail-rleg","tail-mtail","mtail-etail"];
var connection_color= {"head-body" : "hsb(.3, .75, .75)",
                       "body-larm" : "hsb(.6, .75, .75)",
                       "body-rarm" : "hsb(.1, .75, .75)",
                       "body-tail" : "hsb(.3, .75, .75)",
                       "tail-lleg" : "hsb(.6, .75, .75)",
                       "tail-rleg" : "hsb(.1, .75, .75)",
                       "tail-mtail": "hsb(.3, .75, .75)",
                       "mtail-etail":"hsb(.3, .75, .75)"};

var center_point  = "body-tail";

// assigned when using random generation, take care the order should be same as control_points
var rand_coordinates ={};
    rand_coordinates.head = {x:240,y:240,interp:true};
    rand_coordinates.body = {x:240,y:280,interp:true};
    rand_coordinates.larm = {x:200,y:260,interp:true};
    rand_coordinates.rarm = {x:280,y:260,interp:true};
    rand_coordinates.tail = {x:240,y:330,interp:true};
    rand_coordinates.lleg = {x:200,y:300,interp:true};
    rand_coordinates.rleg = {x:280,y:300,interp:true};
    rand_coordinates.mtail= {x:240,y:360,interp:true};
    rand_coordinates.etail= {x:240,y:380,interp:true};

// Beyond this no change should be required by the user
var r;
var play;                       // this is set to stop the playing when paused or stopped
var current_image   = 1;        // the image we are looking at
var show_image      = true;
var show_annotation = true;
var annotation      = [];       
// Note for annotation variable : 
// This should contain image, flow, as well as annotations (coordinates); 
// This is all the data we need to save or should be caring about.
    
// preload all the images and flow; To avoid lags
for (i=0; i<nimages; i++) {
    annotation[i]           = [];
    annotation[i].img       = new Image();
    annotation[i].img.src   = sprintf( img_path, [i+1] );  // name of the image file.
    annotation[i].flow      = new Image();
    annotation[i].flow.src  = sprintf( flow_path, [i+1]);  // name of flow file
}
        
// create raphael element 
r = Raphael("holder",annotation[0].img.width,annotation[0].img.height); 

// Note we have to keep track of every svg element we create so that we can reorder it. 
//txt_element = r.text(310, 20, "drag the points to change the curves").attr({fill: "#fff", "font-size": 16});
//txt_element.toFront();
    
// This function handles drawing of svg and dragging 
// Input : keypoints  is an array similar to data array in annotation
function draw_puppet(keypoints, color) {
    
// We draw all the line by moving(M) and drawing a line (L)
    //function to generate path arrays
    function gen_path_array(str1,str2){
        return ["M", keypoints[str1].x, keypoints[str1].y, "L", keypoints[str2].x, keypoints[str2].y];
    }
        
    // draw connections
    var path = {};
    var curve = {} 
    function draw_connections(){
        connections.forEach( function(ele,idx){
            path[ele] = gen_path_array (ele.split("-")[0],ele.split("-")[1]);
        });
        connections.forEach( function (ele,idx){
            curve[ele] = r.path(path[ele]).attr({stroke: connection_color[ele]||Raphael.getColor(),"stroke-width": 4, "stroke-linecap": "round"});
        });
    }
        
    function redraw_connections(){
        connections.forEach( function(ele,idx){
            path[ele] = gen_path_array (ele.split("-")[0],ele.split("-")[1]);
        });
        connections.forEach( function (ele,idx){
            curve[ele].attr({path:path[ele]});
        });
        var t = center_point.split("-");
        center_control.attr({cx:(keypoints[t[0]].x+keypoints[t[1]].x)/2, cy: (keypoints[t[0]].y+keypoints[t[1]].y)/2});
    } 
    
    draw_connections();
    controls = r.set();
    
    for (var prop in keypoints){
        var attr = (keypoints[prop].interp)? control_attr["interp"]: control_attr["default"];
        controls.push(r.circle(keypoints[prop].x, keypoints[prop].y, 5).attr(attr));
        //console.log(prop);
    }    
    var t = center_point.split("-");
    center_control = r.circle( (keypoints[t[0]].x+keypoints[t[1]].x)/2, (keypoints[t[0]].y+keypoints[t[1]].y)/2,5).attr(control_attr["interp"]);

    // set control listeners for all the points. 
    // This is a perfect example of why people call js a devil
    var base_id = controls[0].id;
    for (var i=0; i < controls.length; i++){
        controls[i].update = function (x, y) {
            var X = this.attr("cx") + x, Y = this.attr("cy") + y;
            keypoints[control_points[this.id-base_id]] = {x: X, y: Y, interp: false};
            this.attr({cx: X, cy: Y});
            this.attr(control_attr["default"]);
            redraw_connections();
            
        }
    }
    
    center_control.update = function (x,y){
        var p=0
        for (var prop in keypoints){
            keypoints[prop] = {x: keypoints[prop].x+x, y: keypoints[prop].y+y, interp:false}    
            controls[p].attr({cx:keypoints[prop].x, cy:keypoints[prop].y}).attr(control_attr["default"]);
            p=p+1;
        } 
        this.attr({cx: this.attr("cx")+x, cy: this.attr("cy")+y});
        this.attr(control_attr["default"]);
        redraw_connections();
    }
     
    controls.drag(move, up);
    center_control.drag(move,up);
    
    center_control.mouseover(function() {
        this.attr(control_attr["mouseover"]);
    });
    center_control.mousedown(function () {
        center_control.update(0,0);                     //set all interp to false
        this.attr(control_attr["mouseover"]); 
    });

    center_control.mouseup(function(){
        this.attr (control_attr["default"]);  
    });

    center_control.mouseout(function(){
        var check = true;
        for (var prop in keypoints){
            check = check & keypoints[prop].interp;
        }
        var attr = check ? control_attr["interp"]: control_attr["default"];    
        this.attr(attr);
    });    


    controls.mousedown(function () {
        this.attr(control_attr["mouseover"]); 
    });
    controls.mouseover(function(){
        this.attr(control_attr["mouseover"]);
    });

    controls.mouseup(function () {
        var prop = control_points[this.id-base_id];
        var attr = (keypoints[prop].interp)? control_attr["interp"]: control_attr["default"];
        this.attr(attr); 
        //look ahead till interp==false or end -- linearly intepolate
        var look_ahead = current_image+1;
        while (look_ahead < nimages && annotation[look_ahead].hasOwnProperty("data")
                && annotation[look_ahead].data[prop].interp===true){
            look_ahead++;
        }
        if (look_ahead < nimages && annotation[look_ahead].hasOwnProperty("data") ){
            //console.log("cont");        
        }else{
            look_ahead--;
        }
            //interpolate...
        if (annotation[look_ahead].hasOwnProperty("data")){
            var x_inc = annotation[look_ahead].data[prop].x - annotation[current_image-1].data[prop].x ;
            var y_inc = annotation[look_ahead].data[prop].y - annotation[current_image-1].data[prop].y ;
        
            x_inc = x_inc/(look_ahead-current_image+1);
            y_inc = y_inc/(look_ahead-current_image+1);
            var x_init = annotation[current_image-1].data[prop].x;
            var y_init = annotation[current_image-1].data[prop].y;

            for (var p = current_image; p < look_ahead; p++){
                annotation[p].data[prop].x = x_init + x_inc*(p-current_image+1);
                annotation[p].data[prop].y = y_init + y_inc*(p-current_image+1);
            }
        }
        
        var look_back = current_image-3;
        while (look_back > -1 && annotation[look_back].hasOwnProperty("data")
                && annotation[look_back].data[prop].interp===true){
            look_back--;
        }
        //console.log(look_back);
        if (look_back > -1 && annotation[look_back].hasOwnProperty("data") 
            && annotation[look_back].data[prop].interp===false ){        //interpolate...
            var x_inc = annotation[look_back].data[prop].x - annotation[current_image-1].data[prop].x ;
            var y_inc = annotation[look_back].data[prop].y - annotation[current_image-1].data[prop].y ;

            x_inc = x_inc/(look_back-current_image+1);
            y_inc = y_inc/(look_back-current_image+1);
            var x_init = annotation[current_image-1].data[prop].x;
            var y_init = annotation[current_image-1].data[prop].y;

            for (var p = current_image-2 ; p > look_back; p--){
                annotation[p].data[prop].x = x_init + x_inc*(p-current_image+1);
                annotation[p].data[prop].y = y_init + y_inc*(p-current_image+1);
            }
        }
            //look back till interp == false --- linearly intepolate else chill
       // console.log("Mouse up");
    });
    
    controls.mouseout(function(){
        var prop = control_points[this.id-base_id];
        var attr = (keypoints[prop].interp)? control_attr["interp"]: control_attr["default"];
        this.attr(attr); 
    });
} // end draw_puppet

function move(dx, dy) {
    this.update(dx - (this.dx || 0), dy - (this.dy || 0));
    this.dx = dx;
    this.dy = dy;
}
        
function up() {
    this.dx = this.dy = 0;
}
    
// updates the frame 
function update_image() {
    img = annotation[current_image-1].img;
    //r.clear(); 
    show_image ? r.image(img.src,0,0,img.width,img.height) : r.rect(0,0,img.width,img.height,0).attr({stroke:'#666'});   
    
    if (show_annotation){
        if (annotation[current_image-1].hasOwnProperty("data")){
            var annotate = annotation[current_image-1].data;
            draw_puppet(annotate);
        }
    }
    
    var new_text = sprintf('you are currently on frame %d / %d', current_image, nimages);
    $('#info-text').text( new_text ); // update the text at the top
}

// set frame no to frame_no
function set_frame( frame_no ) {
    current_image  = frame_no;
    update_image();
}

// moves ahead by no_of_frame --- can take negative no. and go back
function advance_frame(no_of_frame){
    var temp_current_image = current_image + no_of_frame;
    if (temp_current_image > nimages){
        current_image = nimages;
    }else if (temp_current_image < 1){
            current_image = 1;
    }else{
        current_image = temp_current_image;
    }
    update_image();
    return ;
}

// return a data structure like annotation.data, which has new coordinates as per optical flow 
function flow_prediction(predict_from){
    var new_data    = [];
    var img         = new Image();
    var c           = document.createElement("canvas")
    //console.log(predict_from); 
    img.src  = annotation[predict_from].flow.src;           // TODO: fix this numbering; rename the files
                                                            // note that flow for current image is in number 1 less than the image
    c.width  = img.width;
    c.height = img.height;
    
    var w = img.width, h = img.height;
    var ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    
    var idata = ctx.getImageData(0, 0, img.width, img.height);
    var p     = idata.data;
    var l;
    var data = annotation[predict_from].data
    for (var prop in data){
        l = (data[prop].y*w + data[prop].x)*4;
        new_data[prop] = {x:data[prop].x+p[l+1]-128,y:data[prop].y+p[l+2]-128};
    }
    return new_data;
}
 
// raise an error for the user 
function raise_error(err_str){  
    var err_el = r.text(r.width/2,20,err_str).attr({fill: "#FF0000", "font-size": 16});
    err_el.animate({ opacity : 0 },3000,">",function () { });
}

function chkbox(){
    var img_chk = document.getElementById("show_image_chkbox");
    img_chk.checked ? show_image = true : show_image = false;
    
    var annotation_chk = document.getElementById("show_annotation_chkbox");
    annotation_chk.checked ? show_annotation = true : show_annotation = false;
   
    update_image();
}

// copied from
// http://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server
function download(filename, text) {
  var pom = document.createElement('a');
  pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  pom.setAttribute('download', filename);

  pom.style.display = 'none';
  document.body.appendChild(pom);

  pom.click();

  document.body.removeChild(pom);
}

function annotation_to_csv(a){
    return a.reduce(function(prev,cur,idx,arr) { 
        var str="";
        if (cur.data !== undefined ){
            str=cur.img.src;
            for (var i=0;i<control_points.length;i++){
                str=str+" ,"+cur.data[control_points[i]].x+" ,"+cur.data[control_points[i]].y; 
            }
        }
        return prev+"\n"+str;
    }
    ,"");
}

function annotation_to_json(a){
    var temp={};
    for (i=0;i<a.length;i++){
        temp[i]={};
        temp[i].src = a[i].img.src;
        if (a[i].data !== undefined){
            temp[i].data = {};
            for (var p=0;p<control_points.length;p++){
                temp[i].data[control_points[p]] = a[i].data[control_points[p]];
            }
        }
    }
    return JSON.stringify(temp);
}

function play_frames(){
    $('#gen_random_bttn').prop('disabled', true);
    $('#copy_prev_bttn').prop('disabled',true);
    $('#use_flow_bttn').prop('disabled',true);
   
    $('#play_bttn').hide();
    $('#pause_bttn').show();
    
    play = window.setInterval(function() {
        advance_frame(1);
        if (current_image == nimages){
            window.clearInterval(play);
            play = undefined;
            $('#gen_random_bttn').prop('disabled', false);
            $('#copy_prev_bttn').prop('disabled',false);
            $('#use_flow_bttn').prop('disabled',false);
        }
    },1000/FPS);
}
function pause_frames(){
    $('#gen_random_bttn').prop('disabled', false);
    $('#copy_prev_bttn').prop('disabled',false);
    $('#use_flow_bttn').prop('disabled',false);
    $('#play_bttn').show();
    $('#pause_bttn').hide();
    window.clearInterval(play);
            play = undefined;
}

function stop_frames(){
    window.clearInterval(play);
            play = undefined;
    $('#gen_random_bttn').prop('disabled', false);
    $('#copy_prev_bttn').prop('disabled',false);
    $('#use_flow_bttn').prop('disabled',false);
    $('#play_bttn').show();
    $('#pause_bttn').hide();
    set_frame(1);
}

function gen_rand_annotation(){
    // generate a random puppet
    if (!annotation[current_image-1].hasOwnProperty("data")){
        annotation[current_image-1].data = [];
    }     
    var annotate = annotation[current_image-1].data;
    for (var prop in rand_coordinates){
        annotate[prop] ={x: rand_coordinates[prop].x, y: rand_coordinates[prop].y, interp: true}; 
    }
    update_image();
    //console.log('here');
}

function get_copy_num(){
    var ret = document.getElementById('copy_num').value;
    if (isNaN(ret)|| ret===""){
        return 1;
    }else{
        return Number(ret);
    }
    return 1;
}
function copy_annotation(){
    //copy previous annotation
    if (current_image == nimages){
        raise_error("There are no more frames ahead");       
    }else{
        if (!annotation[current_image-1].hasOwnProperty("data")){
            raise_error('No annotation to copy');
        }else{
            var copy_num = get_copy_num();
            var annotate = annotation[current_image-1].data;
            for (var prop in annotate){
                annotate[prop].interp = false;
            }
            for (var i = current_image; i<current_image+copy_num && i<nimages; i++){
                annotation[i].data = jQuery.extend(true,{},annotation[current_image-1].data);
                var annotate = annotation[i].data;
                for (var prop in  annotate){
                    annotate[prop].interp = true;
                }
            }
        }
    }
    update_image();
}

function copy_with_flow(){
    if (current_image == nimages){
        raise_error ("There are no more frames ahead");
    }else{
        if (!annotation[current_image-1].hasOwnProperty("data")){
            raise_error ('No annotation to copy');
        }else{
            var copy_num = get_copy_num();
            var annotate = annotation[current_image-1].data;
            for (var prop in annotate){
                annotate[prop].interp = false;
            }
            for (var i = current_image; i<current_image+copy_num && i<nimages; i++){
                annotation[i].data = flow_prediction(i-1);
                var annotate = annotation[i].data;
                for (var prop in  annotate){
                    annotate[prop].interp = true;
                }
            }
        }
    }
    update_image();
}

function download_annotation(){
    value = $("input[name=download_fmt]:checked").val();
    if (value === "csv"){
        save_string = annotation_to_csv(annotation);
        download("data.txt", save_string);
    }else if (value === "json"){
        save_string = annotation_to_json(annotation);
        download("data.txt", save_string);
    }else{
        alert("no download format selected");
    }
}

$('#fwd_bttn').click(function () {
    advance_frame(1);
});

$('#play_bttn').click(function () {
    play_frames();
});

$('#pause_bttn').click(function () {
    pause_frames();
});

$('#stop_bttn').click(function () {
    stop_frames(); 
});

$('#back_bttn').click( function() {
    advance_frame(-1);
});

$('#gen_random_bttn').click(function() {
    gen_rand_annotation();
});
        
$('#copy_prev_bttn').click(function() {
    copy_annotation();
});   
    
$('#use_flow_bttn').click(function() {
    copy_with_flow();
}); 

$('#dnld_annotation').click(function() {
    download_annotation();
});   

$(document).keydown(function(e){
    switch (e.which){
        case 37: //left
                advance_frame(-1);
                break;
        case 39: //right
                advance_frame(1);
                break;
        case 32: //space
                if (e.ctrlKey){
                    advance_frame(-1);
                }else{
                    advance_frame(1);
                }
                break;
        case 67: //ctrl+c   
                if (e.ctrlKey){
                    copy_annotation();
                }
                break;
        case 70: //f
                if (e.ctrlKey){
                    copy_with_flow();
                }
                break;
        case 82: //r
                if (e.ctrlKey){
                $('#gen_random_bttn').click();
                }
                break;
        case 83: //s
                if (e.ctrlKey){
                    download_annotation();
                }
                break;
        case 80: if (play===undefined){  
                    $('#play_bttn').click();
                }else {
                    $('#pause_bttn').click();
                }
                break;
        case 65:
                if (e.ctrlKey){
                    $('#stop_bttn').click();
                }
                break;
        default: return;
    }
    e.preventDefault();
});
 
set_frame(1);

        // this should give you access to the precomputed flow.
        /* commenting it out for now as we are not using optical flow now- Umang 
        var img = new image()
        var c = document.createelement("canvas")
        img.src = sprintf( flow_path, 1);
        img.onload = function() {
            c.width = img.width;
            c.height = img.height;
            var w = img.width, h = img.height;
            var ctx = c.getcontext("2d");
            ctx.drawimage(img, 0, 0);
            var idata = ctx.getimagedata(0, 0, img.width, img.height);
            var p     = idata.data;
            var lidx;
            var r, g, b, alpha;
            // loop through image pixels
            for (var y=0; y<img.height; y++) {
                for (var x=0; x<img.width; x++) {
                    l = ( y*w + x ) * 4; // convert to linear index
                    r = p[l];   // red should always be zero
                    g = p[l+1]; // green minus 128 is flow in x
                    b = p[l+2]  //  blue minus 128 is flow in y
                    alpha = p[l+3]; // alpha will always be 255
                }
            }
        }
        */
