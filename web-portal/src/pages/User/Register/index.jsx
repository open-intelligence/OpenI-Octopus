import React, {Component} from 'react';
import {render} from 'react-dom';

import RegisterForm from "@/components/RegisterForm";
import OpenIPanel from "@/components/OpenIPanel"

class Register extends Component {
    render(){
        return (
            <OpenIPanel>
                <RegisterForm />
            </OpenIPanel>
        );
    }
}

export default Register;