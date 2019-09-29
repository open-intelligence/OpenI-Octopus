import React, {Component} from 'react';
import {render} from 'react-dom';

import LoginForm from "@/components/LoginForm";
import OpenIPanel from "@/components/OpenIPanel"

class Login extends Component {
    render(){
        return (
            <OpenIPanel>
                <LoginForm />
            </OpenIPanel>
        );
    }
}

export default Login;
