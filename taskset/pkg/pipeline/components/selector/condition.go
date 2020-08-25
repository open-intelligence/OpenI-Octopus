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

package selector

import "regexp"

//Cond is the contion of JobSelector
type Cond struct {
	name   string
	key    string
	expect string
	regexp *regexp.Regexp
}

//GetKey returns the key of the cond
func (c *Cond) GetKey() string {
	return c.key
}

//GetExpect return the expect value of this condition
func (c *Cond) GetExpect() string {
	return c.expect
}

//Test compares the given value with expect value
func (c *Cond) Test(value string) bool {
	return c.regexp.MatchString(value)
}

func (c *Cond) compile() error {
	reg, err := regexp.Compile(c.expect)

	if nil != err {
		return err
	}

	c.regexp = reg

	return nil
}
