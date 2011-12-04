/****************************
 * anagramica
 *
 *  Copyright 2011, Max Irwin (@binarymax)
 *
 ****************************/
"use strict";

var anagramica = window.anagramica;
anagramica = anagramica || {};
if (!anagramica.core) {

	anagramica.core = (function() {

		var subscribers = {};
		var subscribe = function(type,name,callback){
			if(!subscribers[type]) subscribers[type] = [];
			subscribers[type].push({name:name,callback:callback});
		};
		
		var unsubscribe = function(type,name){
			var subs = subscribers[type];
			if(subs instanceof Array) {
				for(var i=0,l=subs.length;i<l;i++) {
					if(subs[i].name===name) {
						subs.splice(i,1);
						l--;
					}
				}
			}
		};

		var notify = function(type,data){
			var subs = subscribers[type];
			if(subs instanceof Array) {
				for(var i=0,l=subs.length;i<l;i++) {
					subs[i].callback(data);
				}
			}
		};

		var ajax = function(url,callback) {
									
			$.ajax({
				url:url,
				type:"GET",
				timeout:1000*15,
				success:function(data,status,jqXHR){
					data = (typeof(data) === 'object')?data:JSON.parse(data);
					callback(data);
				}
			});
			
		};

		return {
			ajax:ajax,
			notify:notify,
			subscribe:subscribe,
			unsubscribe:unsubscribe
		};

	})();

}


if (!anagramica.game) {

	anagramica.game = (function() {

		var gameStates		= {loading:1,waiting:2,letters:3,words:4,checking:5};
		var currGameState = gameStates.loading;

		var boardletters 	= ""; //Letters currently on the board
		var score 			= 0;  //Player's running total score
		var high				= 0;  //Player's highest score
		var best				= []; //Best possible anagrams
		var all				= []; //All possible anagrams

		var consonants 	= "BCDFGHJKLMNPQRSTVWXYZ";
		var vowels 			= "AEIOU";
		
		var limit 			= 2;		
		
		var exceedsLimit = function(letter) {
			var tmp = 0;
			for(var i=0,l=boardletters.length;i<l;i++) {
				if(boardletters.charAt(i)==letter) tmp++;
				if(tmp>=limit) return true;
			}
			return false;
		}		
		
		//Gets a consonant and adds it to the board letters
		var getConsonant = function() {
			var letter = consonants.charAt(parseInt(Math.random()*consonants.length));
			if(exceedsLimit(letter)) while(!exceedsLimit(letter = consonants.charAt(parseInt(Math.random()*consonants.length))));
			boardletters+=letter;
			return letter;
		};

		//Gets a vowel and adds it to the board letters
		var getVowel = function() {
			var letter = vowels.charAt(parseInt(Math.random()*vowels.length));
			if(exceedsLimit(letter)) while(!exceedsLimit(letter = vowels.charAt(parseInt(Math.random()*consonants.length))));
			boardletters+=letter;
			return letter;
		};
		

		//Checks if a word only contains letters from the board
		var validWord = function(word) {
			var a = boardletters.split('');
			var i=0,j=-1,
				w=word.toUpperCase(),
				wl=word.length,
				bl=boardletters.length;

			while(i<wl && i<bl && (j=a.indexOf(w.charAt(i)))>-1) {
				//Letter found on the board, use it up!
				a.splice(j,1);
				i++;
			}
			
			if (i!==wl) {
				//Word contains letters not on the board
				return false;
			}
			
			return true;
		}
		
		//Checks if a word is valid and in the dictionary
		// First checks letters against the board
		// Then checks word against the dictionary
		var checkWord = function(word,callback) {
			
			if (!validWord(word)) {
				//Word contains letters not on the board
				callback(0);

			} else {
				//word only uses board letters.
				//check dictionary on server.
				anagramica.core.ajax("/lookup/" + word,function(data){
					if(data.found && best.length && word.length===best[0].length) { 
						callback(2); //Bonus for longest possible word!
					} else { 
						callback(data.found);
					}			
				});
			}
		};

		var getBest = function(callback) {
			//get the best anagram from the server
			anagramica.core.ajax("/best/" + boardletters,function(data){
				best = data.best;
				callback(data.best);
			});
		};
		
		var getAll = function(callback) {
			//get all anagrams from the server
			anagramica.core.ajax("/all/" + boardletters,function(data){
				all = data.all;
				callback(data.all);
			});
		};

		var startTimer = function(seconds) {
			//start the timer, notify per tick
			var limit = (seconds||30) * 1000;
			var start = new Date();
			var elapsed = 0;
			anagramica.core.notify("starttimer",start);
			var inter = setInterval(function() {
				//tick and notify the controller
				elapsed = (new Date()) - start;
				anagramica.core.notify("tick",{elapsed:elapsed,percent:(elapsed/limit)*100});

				if (elapsed>=limit) { 
					//time up!
					clearInterval(inter);
					endTimer();

				}

			},5);
		};
		
		var endTimer = function(){
			//end the timer
			anagramica.core.notify("endtimer");
		};
				
		//Reset the game
		var reset = function(){
			if(score>high) anagramica.core.notify("high",high=score);
			anagramica.core.notify("score",score);
			boardletters = "";
			score	= 0;
			best	= [];
			all	= [];	
			currGameState = gameStates.checked;
			anagramica.core.notify("gamestate",currGameState);
		};
		 
		var getGameState = function() {
			return currGameState;
		};		 
		 
		var init = function(){			
			anagramica.core.notify("gamestate",currGameState);
			
			anagramica.core.subscribe("points","score",function(points){
				score+=points;
				anagramica.core.notify("score",score);
			});
			
			anagramica.core.subscribe("loaded","game",function(){
				currGameState = gameStates.waiting;
				anagramica.core.notify("gamestate",currGameState);
			});

			anagramica.core.subscribe("started","game",function(){
				currGameState = gameStates.letters;
				anagramica.core.notify("gamestate",currGameState);
			});
			
			anagramica.core.subscribe("chosen","game",function(){
				currGameState = gameStates.words;
				anagramica.core.notify("gamestate",currGameState);
				anagramica.game.startTimer();
			});

			anagramica.core.subscribe("checked","game",function(){
				reset();				
			});

		}; 
		 
		return {
			getConsonant:getConsonant,
			getVowel:getVowel,
			getBest:getBest,
			getAll:getAll,
			validWord:validWord,
			checkWord:checkWord,
			startTimer:startTimer,
			gameStates:gameStates,
			getGameState:getGameState,
			reset:reset,
			init:init
		}
		
	})();
}

if (!anagramica.ui) {
	anagramica.ui = (function() {
		
		var instructions = true;
		
		//Fancy flip the board letter
		function setLetter(target,letter){
			target.removeClass("flip").removeClass("flop").addClass("flip"); //style the letter
			setTimeout(function(){
				if (letter && letter.length) {
					target.addClass("ready");
					target.text(letter.toUpperCase());
				}
				target.addClass("flop");
			},150); //set the board letter text
		}

		//Fancy flip the board letter
		function clearLetter(target){
			target.removeClass("flip").removeClass("flop").addClass("flip"); //style the letter
			setTimeout(function(){
				target.text("").removeClass("ready").addClass("flop");
			},150); //clear the board letter text
		}

		//Freeze the board, show the input
		function freezeBoard() {
			$("#consonant,#vowel").hide();
			$(".scratch").show();
			$(".answer input:first").focus().val('');
		}

		//reset the letter board
		var clearBoard = function(callback) {
			var i=0,j=0;
			$(".letter").each(function(){
				var target = $(this);
				setTimeout(function(){
					clearLetter(target);
					if(++i==10) if(callback) callback();
				},j++*100);
			});
		}

		//Gets the next random letter and sends it to the board
		var nextGameLetter = function() {

				var target = $(".letter:not(.ready):first"); //get the first blank letter
	
				if(target.length) {
					//if the board is not filled up...

					var letter = '';
					if ($(this).attr("id")==="consonant") {
						letter = anagramica.game.getConsonant();
					} else if ($(this).attr("id")==="vowel") { 
						letter = anagramica.game.getVowel();
					}
					//set letter depending on type
					setLetter(target,letter);
					
				}
	
				if(!target.length || !target.parent().next().children(":first").is(".letter")) {
					freezeBoard();
					anagramica.core.notify("chosen");
				}

		}
		
		//sends a message to the letter board
		var messageLetters = function(text,callback) {
			if(text.length>10) return false;
			clearBoard();
			var letters = text.split('');
			var i=0,j=0,l=text.length;
			$(".letter").each(function(){
				var target = $(this);
				setTimeout(function(){
					setLetter(target,letters[i++]||'');
					if(i==l) if(callback) setTimeout(callback,750);
				},j++*100);
			});
		};

		var checkWords = function(callback) {
			//Time up.  Validate words
			$(".scratch").hide();
			$(".answer input").attr("readonly",true);
			var wordcount = $(".word").length;			
			var num = 0;
			if(wordcount===0) {
				callback();
				return;
			}
			$(".word").each(function() {
				var word = $(this);
				var txt = word.find(".text");
				var val = word.find(".value");
				anagramica.game.checkWord(txt.text(),function(found){
					if(found===2) {
						//Bonus!  Longest word found
						var score = txt.text().length * 2;
						txt.addClass("wowz");
						val.addClass("wowz").text('+' + score);
						anagramica.core.notify("points",score);						
					} else if(found===1) {
						//player gains more points for longer words
						var score = txt.text().length;
						txt.addClass("yeah");
						val.addClass("yeah").text('+' + score);
						anagramica.core.notify("points",score);						
					} else {
						//player loses more points for shorter words
						var score = 11-txt.text().length;
						txt.addClass("nyah");
						val.addClass("nyah").text('-' + score);
						anagramica.core.notify("points",0-score);						
					}
					if(++num===wordcount) {
						callback();
					}
				});
			});
		};
		
		var showBest = function(callback) {
			//show the best possible word on the board				
			anagramica.game.getBest(function(best){
				for(var i=0,l=best.length;i<l;i++){
					messageLetters(best[i]);
				}
				callback();
			});
		};
		
		function startGame() {			
			$("#consonant,#vowel").show();
			$(".buttons").show();
			$(".scratch").hide();
			$(".word").remove();
			$(".answer input").attr("readonly",null);
			anagramica.core.notify("score",0);
			anagramica.core.notify("started");
									
		}

		var newGame = function() {
			$(".scratch").hide();
			$(".word").remove();
			hideNewGame();
			anagramica.ui.clearBoard(anagramica.ui.startGame);
		}


		var showNewGame = function() {
			$("#new").show();
		};
		
		var hideNewGame = function() {
			$("#new").hide();
			$("#instructions").hide();
			
		};


		var handleKeys = function(e){

			if(anagramica.game.getGameState() == anagramica.game.gameStates.letters) {
				//Choose letters for the board
				var cons = "cC",vowl = "vV";
				if(e.which==cons.charCodeAt(0) || e.which==cons.charCodeAt(1)) {
					$("#consonant").trigger("click");				
				}
				if(e.which==vowl.charCodeAt(0) || e.which==vowl.charCodeAt(1)) {
					$("#vowel").trigger("click");
				}
			}

			if(anagramica.game.getGameState() == anagramica.game.gameStates.waiting  || anagramica.game.getGameState() == anagramica.game.gameStates.checked) {
				if(e.which==32) {
					//Space Bar to start a new game
					newGame();				
				}

			}

		}
		
		//Handles keypress event for answer input
		var handleAnswer = function(e){
			
			//The entered word
			var word = $(this).val().toLowerCase();
			
			//Enter or tab pressed
			if(word && word.length && (e.which===13 || e.which===27)) {
				
				//Make sure word is not a duplicate
				var exists = false;
				$(".word").each(function() { if(word === $(this).find(".text").text()) exists=true; });

				if(!exists) {
	
					//Save word and clear input.
					var ok = (!anagramica.game.validWord(word))?' invalid':''; 
					$("#words").append("<div class='word"+ok+"'><span class='text'>"+word+"</span><span class='value'>?</span></div>");					
	
					//break to next line for lots of words				
					if (($("#words").find(".word").length%8)===0) $("#words").append("<div style='display:block;'></div>");

				}

				//Clear input and refocus
				$(this).val('').focus();
			}
		}
		
		var ready = function(){
			showNewGame();
			anagramica.core.notify("loaded");
		}

		//Initializes the UI.
		//Only call this once when DOM is ready.		
		function init() {

			anagramica.core.subscribe("starttimer","timer",function(){
				$(".elapsed").css("min-width","0%");
			});

			anagramica.core.subscribe("tick","timer",function(data){
				$(".elapsed").css("min-width",data.percent + "%");				
			});

			anagramica.core.subscribe("endtimer","timer",function(){
				showBest(function(){
					checkWords(function(){
						showNewGame();
						anagramica.core.notify("checked");
					});
				});
				
			});
			
			anagramica.core.subscribe("score","scoreboard",function(score){
				$("#score").text(score);
			});
			
			anagramica.core.subscribe("high","scoreboard",function(high){
				$("#high").text(high);
			});

			anagramica.core.subscribe("gamestate","instructions",function(gameState){
				//Show the proper instructions text:

				if(!instructions) {
					$("#instructions").hide();
					return;
				}				
				
				$("#instructions p").hide();
				$("#instructions").show();
				$("#new").hide();

				switch(gameState) {

					case anagramica.game.gameStates.loading:
						$("#new").show();
						$("#intro").show();
						break;

					case anagramica.game.gameStates.waiting:
						$("#new").show();				
						$("#intro").show();
						break;

					case anagramica.game.gameStates.letters:
						$("#choose").show();
						break;

					case anagramica.game.gameStates.words:
						$("#answer").show();
						break;

					case anagramica.game.gameStates.checked:
						$("#new").show();
						$("#points").show();					
						break;

				};
			});


			//Consonant/Vowel choice by button or keypress
			$("#consonant,#vowel").bind("click",nextGameLetter);
			$(document).bind("keypress",handleKeys);
				   
			//Answer text input keypress
			$(".answer input").bind("keypress",handleAnswer);
			
			$("#new").live("click",newGame);			
			
			$("#close").live("click",function() {
				$("#instructions").hide();
				instructions = false;
			});

		}
		
		return {
			clearBoard:clearBoard,
			messageLetters:messageLetters,
			nextGameLetter:nextGameLetter,
			startGame:startGame,
			init:init,
			ready:ready
		}
	})();
}

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(obj) {
		for(var i=0,l=this.length;i<l;i++) {
			if (this[i]===obj) return i;
		}
		return -1;
	}
}
