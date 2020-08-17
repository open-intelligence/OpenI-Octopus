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

package list

type ele struct {
	packet interface{}
	next   *ele
	pre    *ele
}

const maxcache = 500

//List data structure
type List struct {
	head   *ele
	tail   *ele
	cache  *ele
	cached int
	len    int
}

func (s *List) reuse() (e *ele) {
	if nil == s.cache {
		return &ele{}
	}
	e = s.cache
	s.cache = e.next
	e.next = nil
	s.cached--
	return e
}
func (s *List) recycle(e *ele) {
	if s.cached >= maxcache {
		return
	}
	e.next = s.cache
	e.pre = nil
	e.packet = nil
	s.cache = e
	s.cached++
}

//Push adds an item to the end of the list
func (s *List) Push(v interface{}) {

	e := s.reuse()

	e.packet = v

	if 0 == s.len {
		s.tail = e
		s.head = e
	} else {
		e.pre = s.tail
		s.tail.next = e
		s.tail = e
	}

	s.len++
}

//Unshift adds an item to the head of the list
func (s *List) Unshift(v interface{}) {
	e := s.reuse()
	e.packet = v
	if 0 == s.len {
		s.tail = e
		s.head = e
	} else {
		e.next = s.head
		s.head.pre = e
		s.head = e
	}
	s.len++
}

//Pop acts like stack's pop method,returns the last item in the list
func (s *List) Pop() (rt interface{}) {

	if 0 == s.len {
		return nil
	}

	e := s.tail

	s.tail = e.pre

	s.len--

	if 0 == s.len {
		s.head = nil
		s.tail = nil
	}

	rt = e.packet

	s.recycle(e)

	return rt
}

//Shift returns the first item in the list
func (s *List) Shift() (rt interface{}) {

	if 0 == s.len {
		return nil
	}

	e := s.head

	s.head = e.next

	s.len--

	if 0 == s.len {
		s.head = nil
		s.tail = nil
	}

	rt = e.packet

	s.recycle(e)

	return rt
}

//Get return the item at given position
func (s *List) Get(index int) interface{} {

	if index < 0 || index+1 > s.len {
		return nil
	}

	var c *ele

	if index < s.len/2 {

		c = s.head

		i := 0

		for {

			if i == index {
				break
			}

			c = c.next
			i++
		}

		return c.packet
	}

	c = s.tail

	i := s.len - 1

	for {

		if i == index {
			break
		}

		c = c.pre

		i--
	}

	return c.packet
}

func (s *List) Delete(index int) {

	if index < 0 || index+1 > s.len {
		return
	}

	s.len = s.len - 1

	var c *ele

	c = s.head

	i := 0

	for {

		if i == index {
			break
		}

		c = c.next
		i++
	}

	if c.pre == nil {
		s.head = c.next
		if nil != c.next {
			c.next.pre = nil
		} else {
			s.tail = nil
		}
	} else {
		c.pre.next = c.next
		if nil != c.next {
			c.next.pre = c.pre
		} else {
			s.tail = c.pre
		}
	}
	return
}

//Len return the length of the list
func (s *List) Len() int {
	return s.len
}

//Reset the list
func (s *List) Reset() {

	if nil != s.head && nil != s.tail && maxcache > s.cached {
		s.tail.next = s.cache
		s.cache = s.head
		s.cached += s.len
	}

	s.head = nil
	s.tail = nil
	s.len = 0
}
