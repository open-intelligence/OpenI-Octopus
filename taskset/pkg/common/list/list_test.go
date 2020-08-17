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

import (
	"testing"
)

func TestGet(t *testing.T) {
	L := &List{}
	for i := 0; i < 100; i++ {
		L.Push(i)
	}
	n3 := L.Get(3).(int)
	if n3 != 3 {
		t.Error("Got wrong item")
	}
	n66 := L.Get(66).(int)
	if n66 != 66 {
		t.Error("Got wrong item")
	}
}

func TestDelete(t *testing.T) {
	L := &List{}
	for i := 0; i < 100; i++ {
		L.Push(i)
	}
	L.Delete(49)
	n49 := L.Get(49).(int)

	if n49 != 50 {
		t.Error("Got Wrong Item")
	}
}
