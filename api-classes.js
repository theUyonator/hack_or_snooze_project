const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/**
 * This class maintains the list of individual Story instances
 *  It also has some methods for fetching, adding, and removing stories
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /**
   * This method is designed to be called to generate a new StoryList.
   *  It:
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.*
   */

  // TODO: Note the presence of `static` keyword: this indicates that getStories
  // is **not** an instance method. Rather, it is a method that is called on the
  // class directly. Why doesn't it make sense for getStories to be an instance method?

  static async getStories() {
    // query the /stories endpoint (no auth required)
    const response = await axios.get(`${BASE_URL}/stories`);

    // turn the plain old story objects from the API into instances of the Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    const storyList = new StoryList(stories);
    return storyList;
  }

  /**
   * Method to make a POST request to /stories and add the new story to the list
   * - user - the current instance of User who will post the story
   * - newStory - a new story object for the API with title, author, and url
   *
   * Returns the new story object
   */

  async addStory(user, newStory) {
    // TODO - Implement this functions!
    // this function should return the newly created story so it can be used in
    // the script.js file where it will be appended to the DOM
    const res = await axios.post(`${BASE_URL}/stories`, {

      token: user.loginToken,
      story: {
        author: newStory.author,
        title: newStory.title,
        url: newStory.url
      }
    })
    const newStoryObj = new Story (res.data.story);
    // The newly created story is then added to the top of the stories we have
    this.stories.unshift(newStoryObj);
    // The newly created story is also added to the top of the current user instance own story list
    user.ownStories.unshift(newStoryObj);

    return newStoryObj;

  }

  /**
   * Method to make a DELETE request to /stories and remove the story from the list
   * - user - the current instance of User who will post the story
   * - storyId - an existing story id from an existing story object for the API with title, author, and url
   */

  async removeStory(user, storyId){
    // This function should remove the existing story to be deleted from the api, stories list and user own stories
    await axios({
      url:`${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      data: { token: user.loginToken}
    });
    //Using the filter array method, remove the deleted story from the story list
    this.stories = this.stories.filter(story => story.storyId !== storyId)
    // Using the filter array method , remove the deleted story from the user own stories
    user.ownStories = user.ownStories.filter(s => s.storyId !== storyId);

  }
}


/**
 * The User class to primarily represent the current user.
 *  There are helper methods to signup (create), login, and getLoggedInUser
 */

class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;

    // these are all set to defaults, not passed in by the constructor
    this.loginToken = "";
    this.favorites = [];
    this.ownStories = [];
  }

  /* Create and return a new user.
   *
   * Makes POST request to API and returns newly-created user.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async create(username, password, name) {
    const response = await axios.post(`${BASE_URL}/signup`, {
      user: {
        username,
        password,
        name
      }
    });

    // build a new User instance from the API response
    const newUser = new User(response.data.user);

    // attach the token to the newUser instance for convenience
    newUser.loginToken = response.data.token;

    return newUser;
  }

  /* Login in user and return user instance.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios.post(`${BASE_URL}/login`, {
      user: {
        username,
        password
      }
    });

    // build a new User instance from the API response
    const existingUser = new User(response.data.user);

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = response.data.token;

    return existingUser;
  }

  /** Get user instance for the logged-in-user.
   *
   * This function uses the token & username to make an API request to get details
   *   about the user. Then it creates an instance of user with that info.
   */

  static async getLoggedInUser(token, username) {
    // if we don't have user info, return null
    if (!token || !username) return null;

    // call the API
    const response = await axios.get(`${BASE_URL}/users/${username}`, {
      params: {
        token
      }
    });

    // instantiate the user from the API information
    const existingUser = new User(response.data.user);

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = token;

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
    return existingUser;
  }

  /**
   * This method, retrieves all information of a user once the user is logged in
   * username - the username property of the current instance of user 
   */
  async retrieveDetails(){
    //A get request is made to the api to retrieve the user infor stored on the api
    const response = await axios.get(`${BASE_URL}/users/${this.username}`, {params: {token: this.loginToken}});
    // Now we make sure that all instance properties are the same as what is stored in the api
    this.name = response.data.user.name;
    this.createdAt = response.data.user.createdAt;
    this.updatedAt = response.data.user.updatedAt;
    // For the stories, we have to make sure that we are creating current story instances with the info being retrieved
    this.favorites = response.data.user.favorites.map(fav => new Story(fav));
    console.log(response.data);
    this.ownStories = response.data.user.stories.map(story => new Story(story));
    // Finally we return the current instance of user with all information
    return this
  }

  /**
   * This Method is to make a POST request to /users and add the story to the users favorites
   * - storyId - the story id from the existing story object for the API with title, author, and url
   */

  async addFavorite(storyId){
    //  This function should add an existing story as a favorite in the api and add that story to the users favorite array
    await axios.post(`${BASE_URL}/users/${this.username}/favorites/${storyId}`, {token: this.loginToken});
    // Call the retrieveDetails method to udate user info
    await this.retrieveDetails();
    // Return current instance of the user obj
    return this
   }

   /**
   * This Method is to make a DELETE request to /users and delete the story from the users favorites
   * - storyId - the story id from the existing story object for the API with title, author, and url
   */

  async removeFavorite(storyId){
    //  This function should add an existing story as a favorite in the api and add that story to the users favorite array
     await axios(
      {
        url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
        method: "DELETE",
        data: {token: this.loginToken}
      });
    // Call the retrieveDetails method to udate user info
    await this.retrieveDetails();
    // Return current instance of the user obj
    return this
   }


   /**
   * This method, updates user information
   * username - the username property of the current instance of user 
   */

  async updateUser(userData){
    // Send a patch request to /users to update user name
    const res = await axios.patch(`${BASE_URL}/users/${this.username}`, {token: this.loginToken, user: userData});
    // update the current instance of user to fit the new information
    this.name = res.data.user.name;
    this.updatedAt = res.data.user.updatedAt;
    // Return current instance of the user class 
    return this;

  }

  /**
   * This method, deletes user information
   */

  async deleteUser(){
    // Send a delete request to /users to update user name
     await axios({
       url:`${BASE_URL}/users/${this.username}`,
       method: "DELETE",
       data: {token: this.loginToken}
     });
  }
}

/**
 * Class to represent a single story.
 */

class Story {

  /**
   * The constructor is designed to take an object for better readability / flexibility
   * - storyObj: an object that has story properties in it
   */

  constructor(storyObj) {
    this.author = storyObj.author;
    this.title = storyObj.title;
    this.url = storyObj.url;
    this.username = storyObj.username;
    this.storyId = storyObj.storyId;
    this.createdAt = storyObj.createdAt;
    this.updatedAt = storyObj.updatedAt;
  }

  /**
   * Method to make a PATCH request to /stories 
   * user - the current instance of the user class 
   */

  async updateStory(user, storyData) {
    // TODO - Implement this functions!
    // this function should return the newly created story so it can be used in
    // the script.js file where it will be appended to the DOM
    const res = await axios.patch(`${BASE_URL}/stories/${this,storyId}`, {

      token: user.loginToken,
      story: storyData
    })
    // Update the properties of this instance of the story class
    this.author = res.data.story.author;
    this.title = res.data.story.title;
    this.url = res.data.story.url;
    this.updatedAt = res.data.story.updatedAt;

    // Return current instance of the story which now has newly updated information
    return this;

  }
}