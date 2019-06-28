package types

import (
	"sync"
	"time"
)
type CommitRecord struct{
	lock  sync.RWMutex
	id string 
	ip string
	author string
	image string
	container string
	
	time int64
	status string
	status_msg string
}


func (c *CommitRecord) ToJson() JSON{
	c.lock.RLock()
	defer c.lock.RUnlock()
	return JSON{
		"id":c.id,
		"ip":c.ip,
		
		"time":c.time,
		"author":c.author,
		"container":c.container,
		"image":c.image,

		"status":c.status,
		"status_msg":c.status_msg,
	}
}

func (c *CommitRecord)set(key,value string){
	 
	switch key {
	case "status": 
		c.status = value
	case "time":
		c.time = time.Now().Unix()
	case "author":
		c.author = value
	case "image":
		c.image = value
	case "container":
		c.container = value
	case "id":
		c.id = value
	case "ip":
		c.ip = value
	case "status_msg":
		c.status_msg = value
	}
}
func (c *CommitRecord)get(key string)string{
	c.lock.RLock()
	defer c.lock.RUnlock()

	switch key {
	case "status": 
		return c.status 
	case "author":
		return c.author 
	case "image":
		return c.image
	case "container":
		return c.container
	case "id":
		return c.id
	case "ip":
		return c.ip
	case "status_msg":
		return c.status_msg
	}

	panic("Ilegal key")
}

func (c *CommitRecord)SetTime(){
	c.time = time.Now().Unix()
}

func (c *CommitRecord)GetTime()int64{
	c.lock.RLock()
	defer c.lock.RUnlock()
	return c.time
}

func (c *CommitRecord)SetId(value string){
	c.set("id",value)
}

func (c *CommitRecord)GetId()string{
	return c.get("id")
}


func (c *CommitRecord)SetStatus(value string){
	c.set("status",value)
}

func (c *CommitRecord)GetStatus()string{
	return c.get("status")
}


func (c *CommitRecord)SetAuthor(value string){
	c.set("author",value)
}

func (c *CommitRecord)GetAuthor()string{
	return c.get("author")
}


func (c *CommitRecord)SetImage(value string){
	c.set("image",value)
}

func (c *CommitRecord)GetImage()string{
	return c.get("image")
}

func (c *CommitRecord)SetContainer(value string){
	c.set("container",value)
}

func (c *CommitRecord)GetContainer()string{
	return c.get("container")
}


func (c *CommitRecord)SetNodeIP(value string){
	c.set("ip",value)
}

func (c *CommitRecord)GetNodeIP()string{
	return c.get("ip")
}

func (c *CommitRecord)SetStatusMsg(value string){
	c.set("status_msg",value)
}

func (c *CommitRecord)GetStatusMsg()string{
	return c.get("status_msg")
}

func (c *CommitRecord)WriteAction(action func()){
	c.lock.Lock()
	defer c.lock.Unlock()
	action()
}

func NewCommitRecord()*CommitRecord{
   record:= new(CommitRecord)
   record.SetTime()
   return record
}