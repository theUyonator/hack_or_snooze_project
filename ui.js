$(async function() {
  // cache some selectors we'll be using quite a bit
  const $body = $("body")
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $favoritedStories = $("#favorited-articles")
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $navUserProfile = $("#nav-user-profile")
  const $navSubmit = $("#nav-submit");
  const $navFavorites = $("#nav-favorites");
  const $navMyStories = $("#nav-my-stories");
  const $navWelcome = $("#nav-welcome");
  const $editArticleForm = $("#edit-article-form")
  const $userProfile = $("#user-profile")


  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });


  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for userprofile
   */

  $navUserProfile.on("click", function() {
    // hide all elements and show only user profile information
    hideElements();
    // Show the logged in user profile information
    $userProfile.show();
  });

  /**
   * Event listener for the submit form.
   *  If successfully we will be able to create and add a story to the allstory list
   */

  $submitForm.on('submit', async function(e){

    // Prevent the page from reloading
    e.preventDefault();
    // Collect information entered in the form as their own variables
    const author = $("#author").val();
    const title = $("#title").val();
    const url = $("#url").val();
    // const hostname = getHostName(url);
    const username = currentUser.username;
    // Create a new story object
    const storyObj = await storyList.addStory(currentUser, {
      author,
      title,
      url,
      username
    });
    // Generate a html markup for this story object
    const $storyMarkup = generateStoryMarkUp(storyObj);
    // Add this story markup to the top of the all stories list
    $allStoriesList.prepend($storyMarkup);
    // Hide the submit form and clear input
    $submitForm.slideUp("slow");
    $submitForm.trigger("reset");
  })


  /**
   * Event listener for the submit nav link
   * if successful it is to show the submit form with a slide animation
   */
  $navSubmit.on("click", function(){
    // Using a conditional statement, we are goign to make sure that only a logged in user will be able to access the submit link
    // to add new stories
    if(currentUser){
      // We call the function created to hide some elements in the DOM
      hideElements();
      // We show th story list
      $allStoriesList.show();
      // And we use the jquery slidetoggle to animate the sliding of the submit form
      $submitForm.slideToggle();
    }
   
  })

  /**
   * Event listener for the favorites nav link
   * if successful it is to generate and show the favorited stories
   */
  $navFavorites.on("click", function(){
    // Using a conditional statement, we are going to make sure that only a logged in user will be able to access the favorites link
    // to view favorited stories
    if(currentUser){
      // We call the function created to hide some elements in the DOM
      hideElements();
      // We generate the favorited stories
      generateFavStories();
      // And we use the jquery show property to display the users favorited stories in $favoritedStories
      $favoritedStories.show();
    }
   
  })

  /**
   * Event listener for the my stories nav link
   * if successful it is to generate and show the users created stories
   */
  $navMyStories.on("click", function(){
    // Using a conditional statement, we are going to make sure that only a logged in user will be able to access the my stories link
    // to view favorited stories
    if(currentUser){
      // We call the function created to hide some elements in the DOM
      hideElements();
      // We generate the favorited stories
      generateOwnStories();
      // And we use the jquery show property to display the users created stories in $ownStories
      $ownStories.show();
    }
   
  })

  /**
    * Event handler on the article list, to listen for a favourite
    * If successful, the star will change and the story will be added to favorited stories
    */

  $(".articles-container").on("click", ".star", async function(evt){
    // We want to make sure that only a logged in user can favourite a story
    if(currentUser){
      let $target = $(evt.target);
      let $closestLi = $target.closest("li");
      let $storyId = $closestLi.attr("id");
      // If the story is already favourited, remove it from the current user's favorites array
      if($target.hasClass("fas")){
        // We call the removeFavorite method on the current user instance to remove the favorite story from the api
        await currentUser.removeFavorite($storyId);
        // To remove the favorite from the story on the DOM, we change the target class
        $target.closest("i").toggleClass("fas far");
      }
      else{
        // We call the favorite method on the  current user instance to add favorite story to the api
        await currentUser.addFavorite($storyId);
        // To favorite a story on the DOM, we change the class of the star
        $target.closest("i").toggleClass("far fas");
      }
    }
  })

  /**
   * Event handler on ownstories, to listen for a click on the trashcan
   * If successful, the story will be deleted from the api and from the ownstories list
   */

   $ownStories.on("click", ".trashcan", async function(evt){
    //  We want to make sure that only a logged in user can delete a story
    if(currentUser){
      let $tgt = $(evt.target);
      let $closestLi = $tgt.closest("li");
      let storyId = $closestLi.attr("id")
      // We call the removeStory method on the storyList instance
      await storyList.removeStory(currentUser, storyId);
      // Generate stories again
      await generateStories();
      // hide elements once a story is deleted
      hideElements();
      // Once a story is deleted return back to full list of stories,
      $allStoriesList.show();
      
    }
   })


  /**
   * Event handler for Navigation to Homepage
   */

  $body.on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      generateProfile();
      showNavForLoggedInUser();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();

    // Generate current user profile
    generateProfile();
  }

  /**
   * Once a user is logged in, we want to generate a profile, displaying the user profile information in the nav-user-profile link
   * based on the current user instance, to do so we create a generate profile function
   */
  function generateProfile(){
    // We start by adding the username to the nav user profile
    $navUserProfile.text(`${currentUser.username}`);
    // console.log($navUserProfile);
    // Then we fill in the user profile section
    $("#profile-name").text(`Name: ${currentUser.name}`);
    $("#profile-username").text(`Username: ${currentUser.username}`);
    $("#profile-account-date").text(`Account Created: ${currentUser.createdAt.slice(0, 10)}`);

  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

   /**
   * A function to render HTML for an individual Story instance that will be displayed in the all stories list
   * This function willbe called on once the submit button is clicked
   */

  function generateStoryMarkUp(story) {
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        <span class = "star">
        <i class="far fa-star"></i>
        </span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }
  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story, isOwnStory) {
    let hostName = getHostName(story.url);
    let starType = isFavorite(story) ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';

    // render the trashcan icon
    const trashcan = isOwnStory ? `<i class="fas fa-trash-alt"></i>` : ``;

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
      <span class = "trashcan">
      ${trashcan}
      </span>
      <span class = "star">
      ${starType}
      </span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  /**
   * A function to render HTML for an individual Story instance in the ownstory list
   */
  function generateOwnStories(){
    // We start out by clearing out own stories article
    $ownStories.empty();
    // Check to see if there are any stories in the current user instance own stories array
    if(currentUser){
    // If no stories, in the current user instance, display a message
    if(currentUser.ownStories.length === 0){
      $ownStories.append(`<h5>No added stories by user yet</h5>`);
    }
    // If there are stories in the curent user own story array, render these stories in $ownStories
    else{
      myStories = currentUser.ownStories
      for(let story of myStories){
        $ownStories.append(generateStoryHTML(story, true))
      }
    }
    $ownStories.show();
  } 
  }

  /**
   * A function to render HTML for an individual Story instance in the favorite story list
   */
  function generateFavStories(){
    // We start out by clearing out favorited stories article
    $favoritedStories.empty();
    // Check to see if there are any stories in the current user instance favorite array
    if(currentUser){
    // If no stories, in the current user instance favorites array, display a message
    if(currentUser.favorites.length === 0){
      $favoritedStories.append(`<h5>No favorites added!</h5>`);
    }
    // If there are stories in the curent user favorites array, render these stories in $ownStories
    else{
      favStories = currentUser.favorites;
      for(let story of favStories){
        // Remember we want to be able to favorite both own stories and otherwise, so in the generate Story html, we enter both true and false
        $favoritedStories.append(generateStoryHTML(story, false, true))
      }
    }
    $favoritedStories.show();
  } 
  }


  /**
   * This function will check if a story has been favorited or not, meaning, it'll check to see 
   * which stories are contained in the current user array and make sure there are no duplicate stories
   */

  function isFavorite(story){
    // The favorite stories will be stored in a new set to avoid duplicate stories
    let favoriteStories = new Set();
    // Only a logged in user can see or/and favourite stories
    if(currentUser){
      favoriteStories = new Set(currentUser.favorites.map(s => s.storyId));
    }
    // Return a boolean if the favorite stories set contains a story id or not
    return favoriteStories.has(story.storyId);
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $favoritedStories,
      $ownStories,
      $loginForm,
      $createAccountForm,
      $userProfile
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $userProfile.hide();
    $(".main-nav-links, #user-profile").toggleClass("hidden");
    $navWelcome.show();
    $navLogOut.show();
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
