import React, { useState } from 'react';
import { css } from '@emotion/css'
import Button from './Button';
import { v4 as uuid } from 'uuid';
import { Storage, API, Auth } from 'aws-amplify';
import { createPost } from './graphql/mutations';


/* Initial state to hold form input, saving state */
const initialState = {
  name: '',
  description: '',
  image: {},
  file: '',
  location: '',
  saving: false
};

export default function CreatePost({
  updateOverlayVisibility, updatePosts, posts, user
}) {
  /* 1. Create local state with useState hook */
  const [formState, updateFormState] = useState(initialState)

  /* 2. onChangeText handler updates the form state when a user types into a form field */
  function onChangeText(e) {
    e.persist();
    updateFormState(currentState => ({ ...currentState, [e.target.name]: e.target.value }));
  }

  /* 3. onChangeFile handler will be fired when a user uploads a file  */
  function onChangeFile(e) {
    e.persist();
    if (! e.target.files[0]) return;
    const image = { fileInfo: e.target.files[0], name: `${uuid()}_${e.target.files[0].name}`}
    console.log("onChangeFile image --> " + image.name);
    updateFormState(currentState => ({ ...currentState, file: URL.createObjectURL(e.target.files[0]), image }))
  }

  /* 4. Save the post  */
  async function save() {
    try {
      const { name, description, location, image } = formState;
      if (!name || !description || !location || !image.name) return;
      console.log("on save image --> " + image.name);
      //const user = await Auth.currentAuthenticatedUser();
      //const username = user.username;
      //const tenant = user.attributes['custom:tenant_id'];
      console.log('reg tenant -->' +  user.attributes['custom:tenant_id']);
      console.log('reg user -->' +  user.username);
      //updateFormState(currentState => ({ ...currentState, username }));
      //updateFormState(currentState => ({ ...currentState, tenant }));
      updateFormState(currentState => ({ ...currentState, saving: true }));
      const postId = uuid();
      const postInfo = { name, description, location, image: formState.image.name, id: postId, tenant_id: user.attributes['custom:tenant_id'], userid: user.username };
      //console.log('formState tenant -->' +  formState.tenant);
      //console.log('formState user -->' +  formState.username);
      try {
        //const key = user.attributes['custom:tenant_id'] + '/' + user.username + '/' + formState.image.name;
        //await Storage.put(key, formState.image.fileInfo); // add try catch
        Storage.configure({ level: 'private' });
        await Storage.put(formState.image.name, formState.image.fileInfo); // add try catch
        console.log('Past storage');
        console.log('postInfo -->', postInfo);
      } catch (err) {
        console.log(err);
      }
      
      try {
        await API.graphql({ // add try catch
          query: createPost, variables: { input: postInfo }
        });
      } catch (err) {
        console.log(err);
      }
      updatePosts([...posts, { ...postInfo, image: formState.file, tenant: user.attributes['custom:tenant_id'] }]);
      updateFormState(currentState => ({ ...currentState, saving: false }));
      updateOverlayVisibility(false);
    } catch (err) {
      console.log('error: ', err);
    }
  }

  return (
    <div className={containerStyle}>
      <input
        placeholder="Post name"
        name="name"
        className={inputStyle}
        onChange={onChangeText}
      />
      <input
        placeholder="Location"
        name="location"
        className={inputStyle}
        onChange={onChangeText}
      />
      <input
        placeholder="Description"
        name="description"
        className={inputStyle}
        onChange={onChangeText}
      />
      <input 
        type="file"
        onChange={onChangeFile}
      />
      { formState.file && <video className={imageStyle} alt="preview" src={formState.file} /> }
      <Button title="Create New Post" onClick={save} />
      <Button type="cancel" title="Cancel" onClick={() => updateOverlayVisibility(false)} />
      { formState.saving && <p className={savingMessageStyle}>Saving post...</p> }
    </div>
  )
}

const inputStyle = css`
  margin-bottom: 10px;
  outline: none;
  padding: 7px;
  border: 1px solid #ddd;
  font-size: 16px;
  border-radius: 4px;
`

const imageStyle = css`
  height: 120px;
  margin: 10px 0px;
  object-fit: contain;
`

const containerStyle = css`
  display: flex;
  flex-direction: column;
  width: 400px;
  height: 420px;
  position: fixed;
  left: 0;
  border-radius: 4px;
  top: 0;
  margin-left: calc(50vw - 220px);
  margin-top: calc(50vh - 230px);
  background-color: white;
  border: 1px solid #ddd;
  box-shadow: rgba(0, 0, 0, 0.25) 0px 0.125rem 0.25rem;
  padding: 20px;
`

const savingMessageStyle = css`
  margin-bottom: 0px;
`