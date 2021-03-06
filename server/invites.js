Meteor.methods({

  inviteUser: function(invitation){

    // invite user returns the following hash
    // { newUser : true|false }
    // newUser is true if the person being invited is not on the site yet
    
    // invitation can either contain userId or an email address : 
    // { invitedUserEmail : 'bob@gmail.com' } or { userId : 'user-id' } 
    check(invitation, Match.OneOf(
      { invitedUserEmail : String },
      { userId : String }
    ));

    var user = invitation.invitedUserEmail ?
          Meteor.users.findOne({ emails : { $elemMatch: { address: invitation.invitedUserEmail } } }) :
          Meteor.users.findOne({ _id : invitation.userId }),
        userEmail = invitation.invitedUserEmail ? invitation.invitedUserEmail :
          getEmail(user),
        currentUser = Meteor.user(),
        currentUserCanInvite = currentUserIsAdmin || 
          (currentUser.inviteCount > 0 && canInvite(currentUser)),
        currentUserIsAdmin = isAdmin(currentUser);

    // check if the person is already invited
    if(user && (isInvited(user) || isAdmin(user))){
      throw new Meteor.Error(403, "This person is already invited.");
    } else {

      if(!currentUserCanInvite){
        throw new Meteor.Error(701, "You can't invite this user, sorry.");
      }

      // don't allow duplicate multpile invite for the same person
      var existingInvite = Invites.findOne({ invitedUserEmail : userEmail }); 

      if(existingInvite && !isAdmin(currentUser)){
        throw new Meteor.Error(403, "Somebody has already invited this person.");
      }

      // create an invite
      // consider invite accepted if the invited person has an account already
      var invite = Invites.insert({
        invitingUserId: Meteor.userId(),
        invitedUserEmail: userEmail,
        accepted: typeof user !== "undefined"
      });
      
      // update invinting user
      Meteor.users.update(Meteor.userId(), {$inc: {
        inviteCount: -1,
        invitedCount: 1
      }});

      if(user){
        // update invited user
        Meteor.users.update(user._id, {$set: {
          isInvited: true,
          invitedBy: Meteor.userId(),
          invitedByName: getDisplayName(currentUser),
          invitedByAdmin: isAdmin(currentUser)
        }});
      } 

      var communityName = getSetting('title','Telescope'),
          emailSubject = 'Sei stato invitato ad unirti a '+communityName,
          emailProperties = {
            newUser : typeof user === 'undefined',
            communityName : communityName,
            actionLink : user ? getSigninUrl() : (getSignupUrl() + "?inv=" + invite),
            invitedBy : getDisplayName(currentUser),
            profileUrl : getProfileUrl(currentUser)
          };

      Meteor.setTimeout(function () {
        buildAndSendEmail(userEmail, emailSubject, getTemplate('emailInvite'), emailProperties);
      }, 1);
      
    }
    
    return {
      newUser : typeof user === 'undefined'
    };
  },

  checkIfInvited: function(inviteCode) {

    //after a user signs up via a method like twitter they are asked for their email address.
    //This needs to be checked against current invites

    check(inviteCode, String);

    var user = Meteor.users.findOne(this.userId);

    if (!user) {
      throw new Meteor.Error(403, "You must be logged in");
    }

    var invite = Invites.findOne(inviteCode);
    if (invite) {
      var invitedBy = Meteor.users.findOne({ _id : invite.invitingUserId });

      Meteor.users.update(this.userId, {$set: {
        isInvited: true,
        invitedBy: invitedBy._id,
        invitedByName: getDisplayName(invitedBy),
        invitedByAdmin: isAdmin(invitedBy)
      }});

      Invites.update(invite._id, {$set : {
        accepted : true
      }});
    }
  }
});