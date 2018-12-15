<!--
  Copyright (c) Microsoft Corporation
  All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
  documentation files (the "Software"), to deal in the Software without restriction, including without limitation
  the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
  to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


  Copyright (c) Peking University 2018
 
  The software is released under the Open-Intelligence Open Source License V1.0.
  The copyright owner promises to follow "Open-Intelligence Open Source Platform
  Management Regulation V1.0", which is provided by The New Generation of 
  Artificial Intelligence Technology Innovation Strategic Alliance (the AITISA).

-->

## Open-Exchange RestAPI

### Introduction

Open-Exchange is a model conversion and visualization tool to help users inter-operate among different deep learning frameworks. Convert models between Keras, MXNet and PyTorch.

### Support frameworks
- Keras
- MXNet
- PyTorch (Experimental) 

### Support conversion
- Keras to IR
- MXNet to IR
- PyTorch to IR
- IR to MXNet (Only weight files provided)
- IR to Keras (Only weight files provided)
- IR to PyTorch (Experimental)

### Root URI

Configure the rest server ip and port in [config/exchange-config.yaml](../config/exchange-config-example.yaml).

### API Details

1.`POST source_framwork to IR (Intermediate Representation)`

    Submit the model for model conversion

    *Request*
    ```
    POST /api/v1/exchange
    ```

    *Parameters*
    ```
    {
      * parameters *
      "source_framwork": "MXNet/Keras/PyTorch",
      "destination_framework": "IR",
      "input_shape": "The input shape of the model",
      "output_path": "/path/to/model",

      * parameters for MXNet-to-IR *
      "json_file_path": "The json file for structure of the MXNet model",
      "params_file_path": "The params file for weights of the MXNet model",

      * parameters for Keras-to-IR *
      "json_file_path": "The json file for structure of the Keras model",
      "model_file_path": "The file for the Keras model (filename.h5)",

      * parameters for Pytorch-to-IR *
      "model_file_path": "The file for the Pytorch model" (use torch.save() to generate),

      * optional parameters *
      "model" : {
        "doc_url": "Link to the description document for the model",
        "contributor_name": "List of names of the model's contributors",
        "contributor_email": "Contact information of the model's contributors",
        "contributor_institute": "Institute of the model's contributors",
        "framework_name": "Initial training framework",
        "framework_version": "The version of initial training framework",
        "model_name": "The name of the model",
        "model_version": "The version of the model"
      }
    }
    ```

    *Response if succeeded*
    ```
    Status: 201
    {
      "response": " "source_framwork" to "doel_framework" success! ",
      "json_file_name": "The json file for structure of IR model"
      "proto_file_name": "The proto file for structure of IR model"
      "weights_file_name": "The weights file for structure of IR model"
    }
    ```

    *Response if an error occured*
    ```
    Status: 401

    {
      "error": "OperatorError",
      "message": "The RNN arguments of input are not supported"
    }
    ```

2.`POST IR (Intermediate Representation) to destination_framework`

    Submit the model for model conversion

    *Request*
    ```
    POST /api/v1/exchange
    ```

    *Parameters*
    ```
    {
      * parameters *
      "source_framwork": "IR",
      "destination_framework": "MXNet/Keras/PyTorch",
      "output_path": "/path/to/model",

      * parameters for IR *
      "proto_file_path": "The proto file for structure of IR model",
      "weights_file_path": "The weights file for structure of IR model"
    }
    ```

    *Response if succeeded*
    ```
    Status: 201
    {
      "response": " "source_framwork" to "doel_framework" success! ",
      "weights_file_name": "The weights file for structure of destination_framework model",
    }
    ```

    *Response if an error occured*
    ```
    Status: 401

    {
      "error": "OperatorError",
      "message": "The RNN arguments of input are not supported"
    }
    ```