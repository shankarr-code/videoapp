import React, { useState, useEffect } from "react";
import {
  HashRouter,
  Switch,
  Route
} from "react-router-dom";
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { css } from '@emotion/css';
import { API, Storage, Auth } from 'aws-amplify';
import { listPosts } from './graphql/queries';

import Posts from './Posts';
import Post from './Post';
import Header from './Header';
import CreatePost from './CreatePost';
import Button from './Button';

function Router() {
  /* create a couple of pieces of initial state */
  const [showOverlay, updateOverlayVisibility] = useState(false);
  const [posts, updatePosts] = useState([]);
  const [user, setUser] = useState('');
  const [tenant, setTenant] = useState('');
  //export const  getTenantId = () => { return tenant; }
  //export const  getUsername = () => { return user.username; }

  /* fetch posts when component loads */
  useEffect(() => {
      fetchPosts();
  }, []);
  
  async function fetchPosts() {
    const user = await Auth.currentAuthenticatedUser()
    setUser(user)
    const tenant = user.attributes['custom:tenant_id'];
    console.log("tenant from fetchPosts() :" + tenant);
    setTenant(tenant);
    const usercreds = Auth.currentCredentials;
    console.log("Current cred --> ", usercreds );
    //if (!tenant || !user.username) return;
    console.log("user from fetchPosts() :" + user.username);
    /* query the API, ask for 100 items */
    let qfilter = {
      userid: {
        eq: user.username
      }
    };
    let postData = await API.graphql({ query: listPosts, variables: { limit: 100}});
    let postsArray = postData.data.listPosts.items;
    console.log('post array --> ' + postsArray);
    /* map over the image keys in the posts array, get signed image URLs for each image */
    postsArray = await Promise.all(postsArray.map(async post => {
      //const imageKey = await Storage.get(tenant + '/' + user.username + '/' + post.image);
      Storage.configure({ level: 'private' });
      const imageKey = await Storage.get(post.image);
      console.log('ImageKey ' + imageKey );
      post.image = imageKey;
      return post;
    }));
    /* update the posts array in the local state */
    setPostState(postsArray);
  }
  async function setPostState(postsArray) {
    updatePosts(postsArray);
  }
  return (
    <>
      <HashRouter>
          <div className={contentStyle}>
            <Header 
            user={user}/>
            <hr className={dividerStyle} />
            <Button title="New Post" onClick={() => updateOverlayVisibility(true)} />
            <Switch>
              <Route exact path="/" >
                <Posts posts={posts} />
              </Route>
              <Route path="/post/:id" >
                <Post 
                user={user}/>
              </Route>
            </Switch>
          </div>
          
        </HashRouter>
        { showOverlay && (
          <CreatePost
            updateOverlayVisibility={updateOverlayVisibility}
            updatePosts={setPostState}
            posts={posts}
            user={user}
          />
        )}
    </>
  );
}

const dividerStyle = css`
  margin-top: 15px;
`

const contentStyle = css`
  min-height: calc(100vh - 45px);
  padding: 0px 40px;
`
export default withAuthenticator(Router, {includeGreetings: true});