  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyCTtF1OpFZ1GpUCfS60wht1A3XAMeIT8ME",
    authDomain: "trainscheduler-ea3a8.firebaseapp.com",
    databaseURL: "https://trainscheduler-ea3a8.firebaseio.com",
    storageBucket: "trainscheduler-ea3a8.appspot.com",
    messagingSenderId: "244466238489"
  };

  firebase.initializeApp(config);

  // Create a variable to reference the database.
  var database = firebase.database();
  var trainsRef = database.ref("/trains"); 


$(document).ready(function(){

  $('#btn-bringup-add-train').prop('disabled', true);

  $('#add-train-btn').on('click', function(){
    event.preventDefault();

    var train_name = $('#train-name-input').val().trim();
    var train_destination = $('#train-destination-input').val().trim();
    var train_start_time = $('#first-train-input').val().trim();
    var train_frequency = $('#train-frequncy-input').val().trim();

    try{
       var hour = train_start_time.split(":")[0];
       var minute = train_start_time.split(":")[1];
    }
    catch(err){
       alert("Invalid Start Time for Train entered.Please enter in <Hour>:<Minute> format.");
       return;
    }

    var train = trainsRef.push({
      name : train_name,
      destination : train_destination,
      frequency : train_frequency,
      trainstart: train_start_time,
      created: firebase.database.ServerValue.TIMESTAMP,
      modified: firebase.database.ServerValue.TIMESTAMP
    });

    console.log("Added train -", train_name, train_destination, train_frequency, train_start_time);

 });


    trainsRef.on('child_added', function(childSnapshot){

      setInterval(function() {
        console.log("************interval is running");
      }, 60 * 1000); // 60 * 1000 milsec
      
      var trainObj = childSnapshot.val();
      console.log("This is a snapshot of database: " + JSON.stringify(trainObj));
      
      var trainObjKey = childSnapshot.key; //store the key value for row manipulation

      var first_train = trainObj.trainstart;
      var first_train_hour = first_train.split(":")[0];
      var first_train_minute = first_train.split(":")[1];

      var mmntTrainStarted = moment({hour: first_train_hour, minute: first_train_minute});
      var mmntCurrentTime = moment();
      // console.log("This is the first train converted:" + mmntTrainStarted.format());
      // console.log("Current time converted:" + mmntCurrentTime.format());

      var minutes_elapsed = Math.abs(mmntCurrentTime.diff(mmntTrainStarted,"minutes"));
      // console.log("Elapsed time.." + minutes_elapsed); 

      var reminder_time =  minutes_elapsed % trainObj.frequency;
      // console.log("reminder.." + reminder_time);

      var mmntNextArrival = mmntCurrentTime.add(
              Math.abs(trainObj.frequency - reminder_time),"minutes");

      var minutes_away = Math.abs(trainObj.frequency - reminder_time);

      var mmntOutput = moment({minute: first_train_minute})
      // console.log("Next Arrival.." + mmntNextArrival.format());

      if(mmntCurrentTime.diff(mmntTrainStarted,"minutes") < 0){
         mmntNextArrival = mmntTrainStarted;
         minutes_away = Math.abs(mmntCurrentTime.diff(mmntTrainStarted,"minutes"));
      }

      $("#train-table").append(
        "<tr class='row-train-item' data-key=" + trainObjKey + ">" + 
        "<td class='col-name' contenteditable='true'>" + trainObj.name + '</td>' + 
        "<td class='col-destination' contenteditable='true'>" + trainObj.destination + '</td>' +
        // "<td id='starttime'>" + trainObj.train_start_time + '</td>' +
        "<td class='col-frequency'>" + trainObj.frequency + '</td>' +
        "<td class='col-nexttrain' contenteditable='true'>" + mmntNextArrival.format("H:mm a") + '</td>' +              
        "<td class='col-minutesaway'>" + minutes_away + '</td>' +            
        "<td class='trash' id='delete'><a href='#' data-toggle='tooltip' data-placement ='top' title='Click to delete!'><span class='glyphicon glyphicon-trash'></span></a>" + '</td>' +     
        "<td class='edit'><a href='#' data-toggle='tooltip' data-placement='top' title='Click on columns first to Edit and click me !'><span class='glyphicon glyphicon-edit'></span></a>" + '</td></tr>');     
     });

      //delete rows
      $('#train-table').on('click', '.trash', function(){
        event.preventDefault();
        var dataKey = $(this).parent().data('key');
        console.log(dataKey);

        var removeItem = trainsRef.child(dataKey).remove();
        console.log(removeItem);

        $(this).parent().remove();
      });

      trainsRef.on('child_removed', function(childSnapshot){
          console.log("child has been removed ", childSnapshot);
      });

      //Github Login
      $('#btn-login-train').on('click', function(){
        event.preventDefault();

        // https://trainscheduler-ea3a8.firebaseapp.com/__/auth/handler
        // Client ID
        // d1a2cf47e2a32528dec3
        //     Client Secret
        // 6f4e00fa46ab6b8070b8b8abef446d62b9d06106

        var githubProvider = new firebase.auth.GithubAuthProvider();
        console.log(githubProvider);

        firebase.auth().signInWithPopup(githubProvider).then(function(result) {
        // This gives you a GitHub Access Token. You can use it to access the GitHub API.
        var token = result.credential.accessToken;

        // console.log("GitHub Access Token = ", token);
        // The signed-in user info.
        var user = result.user;
        // console.log("GitHub Access user = ", user);

        $('#btn-login-train').text("You are now logged into Github!");
        $('#btn-login-train').prop('disabled', true);
        $('#btn-bringup-add-train').prop('disabled', false);
    
      }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        console.log(errorCode);

        var errorMessage = error.message;
        console.log(errorMessage);
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
        });
      });

      //Show add train Modal
      $('#btn-bringup-add-train').on('click', function(){
          event.preventDefault();
          $('#addTrainModal').modal('show');
      });

      //Edit rows
      $('#train-table').on('click', '.edit', function(){
        event.preventDefault();

        var thisRow = $(this).parent();
        var train_name = $(this).parent().find(".col-name").html().trim();
        var train_destination = $(this).parent().find(".col-destination").html().trim();
        var next_train = $(this).parent().find(".col-nexttrain").html().trim();
         
        console.log("train-name", train_name);
        console.log("train-destination", train_destination);
        console.log("train-nexttrain", next_train);
        
        var dataKey = $(this).parent().data('key');
        console.log(dataKey , "is being updated");

        var updateItem = trainsRef.child(dataKey).update({
          name : train_name,
          destination : train_destination,
          modified: firebase.database.ServerValue.TIMESTAMP
        });

        console.log("Updated successfully", updateItem);

        var next_train_hour = next_train.split(":")[0];
        var next_train_minute = next_train.split(":")[1];

        console.log("next_train_hour", next_train_hour);
        console.log("next_train_minute", next_train_minute);

        var mmntNextTrain = moment({hour: next_train_hour, minute: next_train_minute});
        var mmntCurrentTime = moment();

        console.log("mmntNextTrain", mmntNextTrain);
        console.log("mmntCurrentTime", mmntCurrentTime);

        var minutes_away = mmntNextTrain.diff(mmntCurrentTime,"minutes");

        console.log("minutes_away", minutes_away);
        $(this).parent().find(".col-minutesaway").html(minutes_away);
      });

      $('[data-toggle="tooltip"]').tooltip(); 
      $('[data-toggle="tooltip"]').hover(function(){
        $('.tooltip-inner').css('min-width', '400px');
        $('.tooltip-inner').css('color', 'red');
      });

});
