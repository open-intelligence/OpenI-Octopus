// MIT License
//
// Copyright (c) PCL. All rights reserved.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE
//

package v1alpha1

import (
	ptrUtils "scheduler/pkg/common/utils"

	// Deprecated in v1.16 in favor of apiextensions.k8s.io/v1
	apiExtensions "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1beta1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// BuildTaskSetCRD declare TaskSet defination
func BuildTaskSetCRD() *apiExtensions.CustomResourceDefinition {
	crd := &apiExtensions.CustomResourceDefinition{
		ObjectMeta: metav1.ObjectMeta{
			Name: TaskSetCRDName,
		},
		Spec: apiExtensions.CustomResourceDefinitionSpec{
			Group:   GroupName,
			Version: SchemeGroupVersion.Version,
			Scope:   apiExtensions.NamespaceScoped,
			Names: apiExtensions.CustomResourceDefinitionNames{
				Plural: TaskSetPlural,
				Kind:   TaskSetKind,
			},
			Validation: buildTaskSetValidation(),
		},
	}

	return crd
}

const (
	// Names in CRD should be up to 63 lower case alphanumeric characters.
	NamingConvention = "^[a-z0-9]{1,63}$"
)

func buildTaskSetValidation() *apiExtensions.CustomResourceValidation {
	return &apiExtensions.CustomResourceValidation{
		OpenAPIV3Schema: &apiExtensions.JSONSchemaProps{
			Properties: map[string]apiExtensions.JSONSchemaProps{
				"metadata": {
					Properties: map[string]apiExtensions.JSONSchemaProps{
						"name": {
							Type:    "string",
							Pattern: NamingConvention,
						},
					},
				},
				"spec": {
					Properties: map[string]apiExtensions.JSONSchemaProps{
						"queue": {
							Type:    "string",
							Pattern: NamingConvention,
						},
						"priority": {
							Type: "integer",
						},
						"retryPolicy": {
							Properties: map[string]apiExtensions.JSONSchemaProps{
								"retry": {
									Type: "boolean",
								},
								"delay": {
									Type:    "integer",
									Minimum: ptrUtils.PtrFloat64(0),
								},
								"maxRetryCount": {
									Type:    "integer",
									Minimum: ptrUtils.PtrFloat64(0),
								},
							},
						},
						"roles": {
							Nullable: false,
							Type:     "array",
							Items: &apiExtensions.JSONSchemaPropsOrArray{
								Schema: &apiExtensions.JSONSchemaProps{
									Properties: map[string]apiExtensions.JSONSchemaProps{
										"name": {
											Type:    "string",
											Pattern: NamingConvention,
										},
										"replicas": {
											Type:    "integer",
											Minimum: ptrUtils.PtrFloat64(1),
											Maximum: ptrUtils.PtrFloat64(10000),
										},
										"eventPolicy": {
											Nullable: false,
											Type:     "array",
											Items: &apiExtensions.JSONSchemaPropsOrArray{
												Schema: &apiExtensions.JSONSchemaProps{
													Properties: map[string]apiExtensions.JSONSchemaProps{
														"event": {
															Type: "string",
														},
														"action": {
															Type: "string",
														},
													},
												},
											},
										},
										"completionPolicy": {
											Properties: map[string]apiExtensions.JSONSchemaProps{
												"maxFailed": {
													Type:    "integer",
													Minimum: ptrUtils.PtrFloat64(-1),
												},
												"minSucceeded": {
													Type:    "integer",
													Minimum: ptrUtils.PtrFloat64(1),
												},
											},
										},
										"retryPolicy": {
											Properties: map[string]apiExtensions.JSONSchemaProps{
												"retry": {
													Type: "boolean",
												},
												"delay": {
													Type:    "integer",
													Minimum: ptrUtils.PtrFloat64(0),
												},
												"maxRetryCount": {
													Type:    "integer",
													Minimum: ptrUtils.PtrFloat64(0),
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}
}
