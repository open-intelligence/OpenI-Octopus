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

package leaderelection

import (
	"time"

	jsoniter "github.com/json-iterator/go"
	v1 "k8s.io/api/coordination/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	types "k8s.io/apimachinery/pkg/types"
	watch "k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/kubernetes/scheme"
	coordinationv1 "k8s.io/client-go/kubernetes/typed/coordination/v1"
	"k8s.io/client-go/rest"
)

// leases implements LeaseInterface
type leases struct {
	client rest.Interface
	ns     string
}

// Get takes name of the lease, and returns the corresponding lease object, and an error if there is any.
func (c *leases) Get(name string, options metav1.GetOptions) (*v1.Lease, error) {

	result := &v1.Lease{}
	//the default json decoder will lose data

	buf, err := c.client.Get().
		Namespace(c.ns).
		Resource("leases").
		Name(name).
		VersionedParams(&options, scheme.ParameterCodec).
		DoRaw()

	if err != nil {
		return nil, err
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	err = json.Unmarshal(buf, result)

	if err != nil {
		return nil, err
	}

	return result, nil
}

// List takes label and field selectors, and returns the list of Leases that match those selectors.
func (c *leases) List(opts metav1.ListOptions) (*v1.LeaseList, error) {
	var timeout time.Duration
	if opts.TimeoutSeconds != nil {
		timeout = time.Duration(*opts.TimeoutSeconds) * time.Second
	}

	result := &v1.LeaseList{}

	buf, err := c.client.Get().
		Namespace(c.ns).
		Resource("leases").
		VersionedParams(&opts, scheme.ParameterCodec).
		Timeout(timeout).
		DoRaw()

	if err != nil {
		return nil, err
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	err = json.Unmarshal(buf, result)

	if err != nil {
		return nil, err
	}

	return result, nil
}

// Watch returns a watch.Interface that watches the requested leases.
func (c *leases) Watch(opts metav1.ListOptions) (watch.Interface, error) {
	var timeout time.Duration
	if opts.TimeoutSeconds != nil {
		timeout = time.Duration(*opts.TimeoutSeconds) * time.Second
	}
	opts.Watch = true

	return c.client.Get().
		Namespace(c.ns).
		Resource("leases").
		VersionedParams(&opts, scheme.ParameterCodec).
		Timeout(timeout).
		Watch()
}

// Create takes the representation of a lease and creates it.  Returns the server's representation of the lease, and an error, if there is any.
func (c *leases) Create(lease *v1.Lease) (*v1.Lease, error) {

	result := &v1.Lease{}

	buf, err := c.client.Post().
		Namespace(c.ns).
		Resource("leases").
		Body(lease).
		DoRaw()

	if err != nil {
		return nil, err
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	err = json.Unmarshal(buf, result)

	if err != nil {
		return nil, err
	}

	return result, nil
}

// Update takes the representation of a lease and updates it. Returns the server's representation of the lease, and an error, if there is any.
func (c *leases) Update(lease *v1.Lease) (*v1.Lease, error) {
	result := &v1.Lease{}
	buf, err := c.client.Put().
		Namespace(c.ns).
		Resource("leases").
		Name(lease.Name).
		Body(lease).
		DoRaw()

	if err != nil {
		return nil, err
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	err = json.Unmarshal(buf, result)

	if err != nil {
		return nil, err
	}

	return result, nil
}

// Delete takes name of the lease and deletes it. Returns an error if one occurs.
func (c *leases) Delete(name string, options *metav1.DeleteOptions) error {
	return c.client.Delete().
		Namespace(c.ns).
		Resource("leases").
		Name(name).
		Body(options).
		Do().
		Error()
}

// DeleteCollection deletes a collection of objects.
func (c *leases) DeleteCollection(options *metav1.DeleteOptions, listOptions metav1.ListOptions) error {
	var timeout time.Duration
	if listOptions.TimeoutSeconds != nil {
		timeout = time.Duration(*listOptions.TimeoutSeconds) * time.Second
	}
	return c.client.Delete().
		Namespace(c.ns).
		Resource("leases").
		VersionedParams(&listOptions, scheme.ParameterCodec).
		Timeout(timeout).
		Body(options).
		Do().
		Error()
}

// Patch applies the patch and returns the patched lease.
func (c *leases) Patch(name string, pt types.PatchType, data []byte, subresources ...string) (*v1.Lease, error) {
	result := &v1.Lease{}

	buf, err := c.client.Patch(pt).
		Namespace(c.ns).
		Resource("leases").
		SubResource(subresources...).
		Name(name).
		Body(data).
		DoRaw()

	if err != nil {
		return nil, err
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	err = json.Unmarshal(buf, result)

	if err != nil {
		return nil, err
	}

	return result, nil

}

// CoordinationClient is used to interact with features provided by the coordination.k8s.io group.
type CoordinationClient struct {
	restClient rest.Interface
}

// RESTClient returns a RESTClient that is used to communicate
// with API server by this client implementation.
func (c *CoordinationClient) RESTClient() rest.Interface {
	if c == nil {
		return nil
	}
	return c.restClient
}

func (c *CoordinationClient) Leases(namespace string) coordinationv1.LeaseInterface {
	return &leases{
		client: c.RESTClient(),
		ns:     namespace,
	}
}

func NewCoordinationClient(config *rest.Config, apiVersion string) *CoordinationClient {
	c := *config
	c.GroupVersion = &schema.GroupVersion{Group: "coordination.k8s.io", Version: apiVersion}

	c.APIPath = "/apis"

	c.NegotiatedSerializer = scheme.Codecs.WithoutConversion()

	if c.UserAgent == "" {
		c.UserAgent = rest.DefaultKubernetesUserAgent()
	}

	client, err := rest.RESTClientFor(&c)

	if err != nil {
		panic(err)
	}

	return &CoordinationClient{
		restClient: client,
	}
}
