
package upload

import (
	"sync"
	"time"
)

type  Task struct {
	id string
	last_active_time int64 
	w_count int
	mutex *sync.Mutex
}

func (t* Task)IsAlive()bool  {
	var alive bool = true
	t.mutex.Lock()
	alive = time.Now().Unix() - t.last_active_time < 20 * 60 && 0 == t.w_count
	t.mutex.Unlock()
	return alive
}

func (t* Task)Active(){
   t.last_active_time = time.Now().Unix()
}

func (t* Task)LockWrite(){
	t.mutex.Lock()
	t.w_count = t.w_count+1
	t.mutex.Unlock()
}

func(t* Task)UnlockWrite(){
	t.mutex.Lock()
	t.w_count = t.w_count -1
	t.mutex.Unlock()
}

func (t *Task)GetWriteCount()int{
	var count int = 0
	t.mutex.Lock()
	count = t.w_count
	t.mutex.Unlock()
	return count
}