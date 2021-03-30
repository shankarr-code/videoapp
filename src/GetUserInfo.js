import { useState } from 'react';
//import { v4 as uuid } from 'uuid';
import { Auth } from 'aws-amplify';


    export const  getTenantId = () => {
        const user = Auth.currentAuthenticatedUser()
        //setUser(user)
        console.log("From getuserinfo" + user);
        const tenant = user.attributes['custom:tenant_id'];
    //setTenant(tenant);
    return tenant;
    }

    export const  getUsername = () => {
        const user = Auth.currentAuthenticatedUser()
        console.log("From getUsername" + user);
        //setUser(user);
        return user.username;
    }
