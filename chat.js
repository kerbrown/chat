Messages = new Mongo.Collection("messages");
Rooms = new Mongo.Collection("rooms");

if (Meteor.isClient) {
  //Subscribe to messages & rooms
  Meteor.subscribe("messages");
  Meteor.subscribe("rooms");

  Session.setDefault("editNickname", false);

   
  var commandFilter = function (message){
    var nickPattern = /^\/nick /i;
    var joinPattern = /^\/join /i;

    if(message.match(nickPattern)){
      var nickname = message.replace(nickPattern,"");
      Meteor.call("updateUserNickname", nickname);

      return "I updated my nickname to " + nickname;

    } else if(message.match(joinPattern)) {
      var roomName = message.replace(joinPattern,"");
      var roomExists = Rooms.find({name: roomName});
      console.log("test ", roomExists);

      return "Switching rooms to " + roomName;

    } else {

      return message;

    }

  };

  Template.body.helpers({
    messages: function (){
      return Messages.find({ roomId: Session.get("currentRoomId")});
    },
    rooms: function (){
      return Rooms.find({});
    }
  });

  Template.body.events({
    'submit .new-message': function (event) {
      var message = event.target.text.value;
      var roomId = Session.get("currentRoomId");
      //console.log("test command", commandFilter("foo"));

      Meteor.call("newMessage", commandFilter(message), roomId);

      // Clear form
      event.target.text.value = "";

      // Prevent default form submit
      return false;
    }
  });

  Template.room.events({
    'click .room-selector': function (event){
      Session.set("currentRoomId", this._id);
    }
  });

  Template.userInfo.events({
    'click .nickname': function (event){
      Session.set("editNickname", !Session.get("editNickname"));
    },
    'click .nickname-cancel': function (event){
      Session.set("editNickname", false);
    },
    'submit .nickname-form': function (event){

      var nickname = event.target.nicknameVal.value;
      Meteor.call("updateUserNickname", nickname);
      Session.set("editNickname", false);

      return false;
    }
  });

  Template.userInfo.helpers({
    editNickname: function (){
      return Session.get("editNickname");
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}

Meteor.methods({
  newMessage: function (message, roomId){
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    //message = Meteor.call("_commandFilter", message);
    Messages.insert({
        text: message,
        username: Meteor.user().username,
        roomId: roomId,
        createdAt: new Date() // current time
    });
  },
  updateUserNickname: function (nickname){
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Meteor.users.update({_id:Meteor.user()._id}, {$set:{"profile.nickname":nickname}});
  }

})
if (Meteor.isServer) {

    Meteor.publish("messages", function () {
      return Messages.find();
    });

    Meteor.publish("rooms", function () {
      return Rooms.find();
    });
}
