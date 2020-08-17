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
	"container/list"
	"sync"
	"sync/atomic"
)

// An AtomicInt is an int64 to be accessed atomically.
type AtomicInt int64

// Cache interface
type Cache interface {
	Set(key string, value interface{})
	Get(key string) (interface{}, bool)
	Delete(key string)
}

// MemCache is an LRU cache. It is safe for concurrent access.
type MemCache struct {
	mutex       sync.RWMutex
	maxItemSize int
	cacheList   *list.List
	cache       map[interface{}]*list.Element
	hits, gets  AtomicInt
}

type entry struct {
	key   interface{}
	value interface{}
}

//NewMemCache If maxItemSize is zero, the cache has no limit.
//if maxItemSize is not zero, when cache's size beyond maxItemSize,start to swap
func NewMemCache(maxItemSize int) *MemCache {
	return &MemCache{
		maxItemSize: maxItemSize,
		cacheList:   list.New(),
		cache:       make(map[interface{}]*list.Element),
	}
}

//Get value with key
func (c *MemCache) Get(key string) (interface{}, bool) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	c.gets.Add(1)
	if ele, hit := c.cache[key]; hit {
		c.hits.Add(1)
		c.cacheList.MoveToFront(ele)
		return ele.Value.(*entry).value, true
	}
	return nil, false
}

//Set a value with key
func (c *MemCache) Set(key string, value interface{}) {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	if c.cache == nil {
		c.cache = make(map[interface{}]*list.Element)
		c.cacheList = list.New()
	}

	if ele, ok := c.cache[key]; ok {
		c.cacheList.MoveToFront(ele)
		ele.Value.(*entry).value = value
		return
	}

	ele := c.cacheList.PushFront(&entry{key: key, value: value})
	c.cache[key] = ele
	if c.maxItemSize != 0 && c.cacheList.Len() > c.maxItemSize {
		c.RemoveOldest()
	}
}

//Delete delete the key
func (c *MemCache) Delete(key string) {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	if c.cache == nil {
		return
	}
	if ele, ok := c.cache[key]; ok {
		c.cacheList.Remove(ele)
		key := ele.Value.(*entry).key
		delete(c.cache, key)
		return
	}
}

//RemoveOldest remove the oldest key
func (c *MemCache) RemoveOldest() {
	if c.cache == nil {
		return
	}
	ele := c.cacheList.Back()
	if ele != nil {
		c.cacheList.Remove(ele)
		key := ele.Value.(*entry).key
		delete(c.cache, key)
	}
}

// Add atomically adds n to i.
func (i *AtomicInt) Add(n int64) {
	atomic.AddInt64((*int64)(i), n)
}

// Get atomically gets the value of i.
func (i *AtomicInt) Get() int64 {
	return atomic.LoadInt64((*int64)(i))
}
