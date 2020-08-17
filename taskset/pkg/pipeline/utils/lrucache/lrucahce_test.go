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

package lrucache

import (
	"testing"
)

func TestMemCache_Get(t *testing.T) {
	var cache Cache
	cache = NewMemCache(1)
	values := []string{"test1", "test2", "test3"}
	keys := []string{"key1", "key2", "key3"}
	for i := 0; i < len(keys); i++ {
		k := keys[i]
		v := values[i]
		cache.Set(k, v)
		val, ok := cache.Get(k)
		if !ok {
			t.Fatalf("expect key:%v ,value:%v", k, val)
		} else if ok && val != v {
			t.Fatalf("expect value:%v, get value:%v", v, val)
		}
		t.Logf("value:%v ", val)
	}
}
