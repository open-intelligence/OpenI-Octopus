// created by yyrdl on 2018.12.18

package gbeta2

import (
	"sync"
)

type Ctx struct {
	mu    *sync.RWMutex
	store map[string]interface{}
}

 
func (c *Ctx) Set(key string, value interface{}) {
	c.mu.Lock()
	c.store[key] = value
	c.mu.Unlock()
}

 
func (c *Ctx) Get(key string) interface{} {
	c.mu.RLock()
	v := c.store[key]
	c.mu.RUnlock()
	return v
}
 
func (c *Ctx) Delete(key string) {
	c.mu.Lock()
	delete(c.store, key)
	c.mu.Unlock()
}

 
func (c *Ctx) Clear() {
	c.mu.Lock()
	for key, _ := range c.store {
		delete(c.store, key)
	}
	c.mu.Unlock()
}


func NewContext() *Ctx {
	c := new(Ctx)
	c.mu = new(sync.RWMutex)
	c.store = make(map[string]interface{}, 5)
	return c
}