/**
 * Sprites
 */
var s_bird, s_bg, s_fg, s_pipeNorth, s_pipeSouth, s_text, s_score, s_splash, s_buttons, s_numberS, s_numberB, s_new, s_medal, s_highScore;

/**
 * Canvas
 */
var canvas, ctx, width, height,type = "touchstart";

/**
 * Other variables
 */
var fgpos = 0, frames = 0, best = 0, saved = false, showed = false, currentstate, currentmedal;

/**
 * Buttons
 */
var okbtn, startbtn, scorebtn, menubtn, resetbtn;

/**
 * Audio
 */
var flap, point, fail;

/**
 * Enum of game states
 */
states = {
    Splash : 0, Game: 1, Score: 2, Start : 3, HighScore : 4
};
 
/**
 * Enum of medals
 */ 
medals = {
    Gold: 0, Platina : 1, Bronze : 2,Silver: 3
};

/**
 * Score witch parameters
 */
score = {
    value: 0,
    position : 0,
    day : 0,
    year : 0,
    month : 0,
    hour :0,
    minutes : 0,
    second : 0
};

/**
 * Flappy with variables and functions
 */
bird = {
    x: 60,
    y: 0,
    frame: 0,
    velocity: 0,
    animation: [0, 1, 2, 1], // animation sequence
    rotation: 0,
    radius: 12,
    gravity: 0.25,
    _jump: 4.6,
    
    /**
     * Makes the bird "flap" and jump
     */
    jump: function() {
            this.velocity = -this._jump;
            flap.play();
    },
    
    /**
     * Update sprite animation and position of bird
     */
    update: function() {
        // make sure animation updates and plays faster in gamestate
        var n = currentstate === states.Splash ? 10 : 5;
        this.frame += frames % n === 0 ? 1 : 0;
        this.frame %= this.animation.length;
        // in splash state make bird hover up and down and set
        // rotation to zero
        if (currentstate === states.Splash) {
                this.y = height - 280 + 5*Math.cos(frames/10);
                this.rotation = 0;
        } 
        else { 
            this.velocity += this.gravity;
            this.y += this.velocity;
            
            // change to the score state when bird touches the ground
            if (this.y >= height - s_fg.height-10) {
                    this.y = height - s_fg.height-10;
                    if (currentstate === states.Game) {
                            currentstate = states.Score;
                            fail.play();
                    }
                    // sets velocity to jump speed for correct rotation
                    this.velocity = this._jump;
            }
            if(this.y <= 0){
                this.y = 0;
                this.velocity = this._jump;
            }
            // when bird lack upward momentum increment the rotation
            // angle
            if (this.velocity >= this._jump) {
                    this.frame = 1;
                    this.rotation = Math.min(Math.PI/2, this.rotation + 0.3);
            } else {
                    this.rotation = -0.3;
            }
        }
    },
    
    /**
     * Draws bird with rotation to canvas ctx
     * @param  {ctx} ctx Context of canvas
     */
    draw: function(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        s_bird[this.animation[this.frame]].draw(ctx, -s_bird[this.animation[this.frame]].width/2, -s_bird[this.animation[this.frame]].height/2);
        ctx.restore();
    }
},
  
/**
 * Pipe with variable and functions
 */
pipe = {
    
    pipes: [],
    
    /**
     * Reset array of pipes 
     */
    reset: function(){
        this.pipes = [];
    },
    
    /**
     * Update positions of pipes, check colisions and add score
     */
    update : function() {
        if(frames % 100  === 0){
            var _y = height - (s_pipeSouth.height + s_fg.height + 170 + 200*Math.random());
            this.pipes.push({
                x: 500,
                y: _y,
                width : s_pipeSouth.width,
                height: s_pipeSouth.height
            });
        }
        var len  = this.pipes.length;
        for(var i = 0; i < len;i++){
            var p = this.pipes[i];
            
            if (i === 0) {
                score.value += p.x === bird.x ? 1 : 0;
                if(p.x === bird.x){
                    point.play();
                }
                
                // collision check, calculates x/y difference and
                // use normal vector length calculation to determine
                // intersection
                var cx  = Math.min(Math.max(bird.x, p.x), p.x+p.width);
                var cy1 = Math.min(Math.max(bird.y, p.y), p.y+p.height);
                var cy2 = Math.min(Math.max(bird.y, p.y+p.height+80), p.y+2*p.height+80);
                // closest difference
                var dx  = bird.x - cx;
                var dy1 = bird.y - cy1;
                var dy2 = bird.y - cy2;
                // vector length
                var d1 = dx*dx + dy1*dy1;
                var d2 = dx*dx + dy2*dy2;
                var r = bird.radius*bird.radius;
                // determine intersection
                if (r > d1 || r > d2) {
                        currentstate = states.Score;
                        fail.play();
                }
            }
            
            p.x -= 2;
            if(p.x < -50){
                this.pipes.splice(i,1);
                i--;
                len--;
            }   
        }
    },
    
    /**
     * Draws pipes to canvas ctx
     * @param  {ctx} ctx Context of canvas
     */
    draw : function (ctx) {
        for (var i = 0, len = this.pipes.length; i < len; i++) {
                var p = this.pipes[i];
                s_pipeSouth.draw(ctx, p.x, p.y);
                s_pipeNorth.draw(ctx, p.x, p.y+80+p.height);
        }
    }
};
  
/**
 * Based on current state choose which action will be performed
 * @param {type} evt click or touch
 */
function onpress(evt){
    var mx,my;
    if(type === "touchstart"){
        mx = evt.changedTouches[0].pageX;
        my = evt.changedTouches[0].pageY; 
    }else{
          mx = evt.offsetX;
          my = evt.offsetY;
    }
    
    switch(currentstate){
        case states.Start:
            if(startbtn.x < mx && mx < startbtn.x + startbtn.width && startbtn.y < my && my < startbtn.y + startbtn.height){
                currentstate = states.Splash;
            }
            if(scorebtn.x < mx && mx < scorebtn.x + scorebtn.width && scorebtn.y < my && my < scorebtn.y + scorebtn.height){
                currentstate = states.HighScore;
            } 
        break;
        
        case states.Splash:
            currentstate = states.Game;
            bird.jump();
        break;
        
        case states.Game:
            bird.jump();   
        break;
            
        case states.Score:
            if(okbtn.x < mx && mx < okbtn.x + okbtn.width && okbtn.y < my && my < okbtn.y + okbtn.height){
                pipe.reset();
                currentstate = states.Start;
                score.value = 0;
                score.position = 0;
                saved = false;
            }
        break;
        
        case states.HighScore:
        if(resetbtn.x < mx && mx < resetbtn.x + resetbtn.width && resetbtn.y < my && my < resetbtn.y + resetbtn.height){
            localStorage.clear();
        }
        if(menubtn.x < mx && mx < menubtn.x + menubtn.width && menubtn.y < my && my < menubtn.y + menubtn.height){
            currentstate = states.Start;
        }  
        break;
    }
}

window.mobilecheck = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};


/**
 * Call main function when page load
 */
$(window).load(function(){ 
    main(); 
});

/**
 * Main function, init context, set width, load sprites and audio
 */
function main(){
    canvas = document.getElementById('myCanvas');

    width = window.innerWidth;
    height = window.innerHeight;
     
    if(!mobilecheck()){
      type = "click"; 
      width = 375;
      height = 667;
    }
        
    document.addEventListener( type, onpress, false);
    
    canvas.width = width;
    canvas.height = height;

    ctx = canvas.getContext("2d");

    currentstate =  states.Start;

    var img = new Image();
    img.onload = function() {
        initSprites(this);
        initBtns();
        run();
    };
    img.src = "sheet.png";
    
    flap = new Audio("flap.mp3"); 
    point = new Audio("point.mp3"); 
    fail = new Audio("fail.mp3"); 
};

/**
 * Initialize all buttons in game
 */
function initBtns(){
    okbtn = {
        x: (width - s_buttons.Ok.width)/2,
        y :  height/1.8,
        width : s_buttons.Ok.width,
        height :s_buttons.Ok.height
    };
    
    startbtn = {
        x: (width - s_buttons.Score.width)/2,
        y :  height/2.5,
        width : s_buttons.Score.width,
        height :s_buttons.Score.height
    };
    
    scorebtn = {
        x: (width - s_buttons.Score.width)/2,
        y :  height/2,
        width : s_buttons.Score.width,
        height :s_buttons.Score.height
    };
    
    menubtn = {
        x:(width - 2*s_buttons.Menu.width),
        y :  height/1.8,
        width : s_buttons.Menu.width,
        height :s_buttons.Menu.height
    };
    
    resetbtn = {
        x: (s_buttons.Reset.width),
        y :  height/1.8,
        width : s_buttons.Reset.width,
        height :s_buttons.Reset.height
    };
}

/**
 * Loop canvas, update sprites and render them
 */
function run() {
    var loop = function(){
        update();
        render();
        window.requestAnimationFrame(loop, canvas);    
    };
    window.requestAnimationFrame(loop, canvas);
};

/**
 * Update pipes and bird
 * In Game and Splash state change foreground positions for move effect
 */        
function update(){
    frames++;
    if (currentstate !== states.Score && currentstate !== states.Start && currentstate !== states.HighScore) {
            fgpos = (fgpos - 2) % 14;
    }
    if (currentstate === states.Game) {
            pipe.update();
    }
    bird.update();
};

/**
 * In concrete state, function draw their sprites
 */        
function render(){
    ctx.fillStyle = s_bg.color;
    ctx.fillRect(0,0,width, height);
    s_bg.draw(ctx,0,height - s_bg.height);
    s_bg.draw(ctx,s_bg.width,height - s_bg.height);
    
    if(currentstate !== states.Start && currentstate !==states.HighScore){
        pipe.draw(ctx);
        bird.draw(ctx);
    }  
    s_fg.draw(ctx, fgpos, height - s_fg.height);
    s_fg.draw(ctx, fgpos + s_fg.width , height - s_fg.height);
    
    if(currentstate === states.Start){
           s_text.FlappyBird.draw(ctx, width/2 - s_text.GetReady.width/2 - 5, height/4 );
           s_buttons.Start.draw(ctx, startbtn.x,startbtn.y);
           s_buttons.Score.draw(ctx,scorebtn.x,scorebtn.y);
           saved= false;   
    }
    if(currentstate === states.HighScore){
         drawHighScore(ctx);
         s_buttons.Menu.draw(ctx, menubtn.x, menubtn.y);
         s_buttons.Reset.draw(ctx,  resetbtn.x, resetbtn.y);
    } 
    else{ 
       if(currentstate === states.Splash){
        s_splash.draw(ctx,width/2 - s_splash.width/2,height/3);
        s_text.GetReady.draw(ctx, width/2 - s_text.GetReady.width/2, height/4 );
        
       }
       if(currentstate === states.Score){ 
            if(!saved){
               setDate();
               saveScore();
               saved = true;
            }
            s_text.GameOver.draw(ctx, width/2 - s_text.GameOver.width/2, height/4);
            s_score.draw(ctx, width/2 - s_score.width/2, height/3);
            s_buttons.Ok.draw(ctx, okbtn.x, okbtn.y);
            s_numberS.draw(ctx,width/2 - s_score.width/5,height/4 + s_score.height/1.3, score.value, null,10);
            s_numberS.draw(ctx,width/2 - s_score.width/5,height/4 + s_score.height*1.14, best, null,10);
            if(score.value === best){
                s_new.draw(ctx,width/2 + s_new.width/2,height/4 + s_score.height*0.985);
            }
            drawMedal(ctx);           
       }     
       if(currentstate === states.Game){
            s_numberB.draw(ctx,null, 20, score.value, width/2);   
       }  
    } 
};

/**
 * Draw highscore loaded from local storage
 * @param {type} ctx Context of canvas
 */
function drawHighScore(ctx){
    s_highScore.draw(ctx,width/2 - s_highScore.width/2, height/12);
    
    for(var i = 0; i < localStorage.length;i++){
        var retrievedObject = localStorage.getItem('flappy'+i);
        var object = JSON.parse(retrievedObject);
       
        s_numberS.draw(ctx,resetbtn.width/2, height/5+i*20, object.position, null, 1);
        ctx.fillStyle = "black";
        ctx.font = "60px Times new Roman";
        ctx.fillText(".",s_buttons.Reset.width/2 + 10,height/5+14+i*20);
        ctx.fillStyle = "white";
        ctx.font = "20px Times new Roman";
        ctx.fillText(".",s_buttons.Reset.width/2 + 15,height/5+12+i*20);

        s_numberS.draw(ctx,resetbtn.width*1.1, height/5+i*20, object.value, null, 1);

        s_numberS.draw(ctx,resetbtn.width*1.8, height/5+i*20, object.day, null, 1);
        ctx.fillStyle = "white";
        ctx.font = "20px Times new Roman"; 
        ctx.fillText("/",resetbtn.width*1.8 + 15,height/5+14+i*20);

        s_numberS.draw(ctx,resetbtn.width*2.25, height/5+i*20,  (object.month), null, 1);
        ctx.fillStyle = "white";
        ctx.font = "20px Times new Roman"; 
        ctx.fillText("/",resetbtn.width*2.44,height/5+14+i*20);

        s_numberS.draw(ctx,resetbtn.width*2.65, height/5+i*20,  object.year, null, 1);

        s_numberS.draw(ctx,resetbtn.width*3.3, height/5+i*20,  object.hour, null, 1);
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Times new Roman"; 
        ctx.fillText(":",resetbtn.width*3.29 + 15,height/5+12+i*20);

        s_numberS.draw(ctx,resetbtn.width*3.75, height/5+i*20,  object.minutes, null, 1);
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Times new Roman"; 
        ctx.fillText(":",resetbtn.width*3.92,height/5+14+i*20);
        s_numberS.draw(ctx,resetbtn.width*4.2, height/5+i*20,  object.second, null, 1);
    }  
};

/**
 * Choose medal to draw based on score
 * @param {type} ctx Context of canvas
 */
function drawMedal(ctx){
    var m = false;
    if(score.value >= 10 && score.value < 20){
        currentmedal = medals.Bronze;
        m = true;
    }
    if(score.value >= 20 && score.value < 30){
        currentmedal = medals.Silver;
        m = true;
    }
    if(score.value >= 30 && score.value < 40){
        currentmedal = medals.Gold;
        m = true;
    }
    if (score.value >= 40){
        currentmedal = medals.Platina;
        m = true;
    }
    if(m){
        s_medal[currentmedal].draw(ctx, width/2 - s_medal[currentmedal].width/2 - 65, height/4 + s_score.height/1.17);   
    } 
}

/**
 * Set actual date and time for score
 */
function setDate(){
    var currentdate = new Date();
    score.day = ((currentdate.getDate() < 10 )? ("0" + currentdate.getDate() ): currentdate.getDate() );
    score.month = ((currentdate.getMonth()+1 < 10 )? ("0" + currentdate.getMonth()) : currentdate.getMonth());
    score.year = ((currentdate.getYear()< 10 )? ("0" + currentdate.getFullYear().toString().substr(-2) ): currentdate.getFullYear().toString().substr(-2));
    score.hour = ((currentdate.getHours() < 10 )? ("0" + currentdate.getHours()) : currentdate.getHours() );
    score.minutes = ((currentdate.getMinutes() < 10 )? ("0" + currentdate.getMinutes()) : currentdate.getMinutes() );
    score.second = ((currentdate.getSeconds() < 10 )? ("0" + currentdate.getSeconds()) : currentdate.getSeconds());
}

/**
 * Save score to local storage
 * Only first 10 positions
 */
function saveScore()
{
    var indx = localStorage.length; 
    var scoreArray = new Array();
         
    for(var i = 0; i < indx;i++){
        var retrievedObject = localStorage.getItem('flappy'+i);
        var object = JSON.parse(retrievedObject);
        scoreArray.push(object);
    }
    
    scoreArray.push(score);
    BubleSort(scoreArray); 
  
    best = scoreArray[0].value;
    
    localStorage.clear();
   
    for(var i = 0; i < ((scoreArray.length - 1) === 10 ? 10 : scoreArray.length);i++){
        scoreArray[i].position = i+1;
        localStorage.setItem('flappy'+i, JSON.stringify(scoreArray[i]));
    }
}

/**
 * Sort scores based on value
 * @param {type} a Array of scores
 */
function BubleSort(a){
    var swapped;
    do {
        swapped = false;
        for (var i=0; i < a.length-1; i++) {
            if (a[i].value < a[i+1].value) {
                var temp = a[i];
                a[i] = a[i+1];
                a[i+1] = temp;
                swapped = true;
            }
        }
    } while (swapped);  
}

/**
 * Simple sprite class
 * 
 * @param {Image}  img    spritesheet image
 * @param {number} x      x-position in spritesheet
 * @param {number} y      y-position in spritesheet
 * @param {number} width  width of sprite 
 * @param {number} height height of sprite
 */
function Sprite(img, x, y, width, height) {
	this.img = img;
	this.x = x*2;
	this.y = y*2;
	this.width = width*2;
	this.height = height*2;
};

/**
 * Draw sprite ta canvas context
 * 
 * @param  {CanvasRenderingContext2D} ctx context used for drawing
 * @param  {number} x   x-position on canvas to draw from
 * @param  {number} y   y-position on canvas to draw from
 */
Sprite.prototype.draw = function(ctx, x, y) {
	ctx.drawImage(this.img, this.x, this.y, this.width, this.height,
		x, y, this.width, this.height);
};

/**
 * Initate all sprite
 * 
 * @param  {Image} img spritesheet image
 */
function initSprites(img) {

    s_bird = [
            new Sprite(img, 156, 115, 17, 12),
            new Sprite(img, 156, 128, 17, 12),
            new Sprite(img, 156, 141, 17, 12)
    ];
    
    s_highScore = new Sprite(img,79,207,97, 30);

    s_medal = [
        new Sprite(img,174,137,22,22),
        new Sprite(img,174,114,22,22),
        new Sprite(img,198,137,22,22),
        new Sprite(img,198,114,22,22)
    ];
    
    s_new = new Sprite(img, 196,169,17,7);

    s_bg = new Sprite(img,   0, 0, 138, 114);
    s_bg.color = "#70C5CF"; // save background color
    s_fg = new Sprite(img, 138, 0, 112,  56);

    s_pipeNorth = new Sprite(img, 251, 0, 26, 200);
    s_pipeSouth = new Sprite(img, 277, 0, 26, 200);

    s_text = {
            FlappyBird: new Sprite(img, 59, 115, 96, 20),
            GameOver:   new Sprite(img, 59, 136, 94, 19),
            GetReady:   new Sprite(img, 59, 156, 87, 20)
    };

    s_buttons = {
            Reset:  new Sprite(img,  79, 177, 40, 14),
            Menu:  new Sprite(img, 119, 177, 40, 14),
            Share: new Sprite(img, 159, 177, 40, 14),
            Score: new Sprite(img,  79, 191, 40, 14),
            Ok:    new Sprite(img, 119, 191, 40, 14),
            Start: new Sprite(img, 159, 191, 40, 14)
    };

    s_score  = new Sprite(img, 138,  56, 113, 58);
    s_splash = new Sprite(img,   0, 114.5,  59, 49);

    s_numberS = new Sprite(img, 0, 177, 6,  7);
    s_numberB = new Sprite(img, 0, 188, 7, 10);
            
    /**
     * Draw number to canvas
     * 
     * @param  {CanvasRenderingContext2D} ctx context used for drawing
     * @param  {number} x      x-position
     * @param  {number} y      y-position
     * @param  {number} num    number to draw
     * @param  {number} center center to offset from
     * @param  {number} offset padd text to draw right to left
     */
    s_numberS.draw = s_numberB.draw = function(ctx, x, y, num, center, offset) {
        num = num.toString();

        var step = this.width + 2;

        if (center) {
                x = center - (num.length*step-2)/2;
        }
        if (offset) {
                x += step*(offset - num.length);
        }

        for (var i = 0, len = num.length; i < len; i++) {
            var n = parseInt(num[i]);
            ctx.drawImage(img, step*n, this.y, this.width, this.height,
                    x, y, this.width, this.height);
            x += step;
        }
    };
}