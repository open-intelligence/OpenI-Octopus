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

package token

import (
	"errors"
	"math/rand"
	"scheduler/pkg/pipeline/constants/authority"
	author "scheduler/pkg/pipeline/constants/authority"
	tokenModel "scheduler/pkg/pipeline/models/token"
	lrucache "scheduler/pkg/pipeline/utils/lrucache"
	"time"
)

var cache = lrucache.NewMemCache(2048)

// Get returns the authority according to the given token
func (s *Service) Get(token string) (authority int, err error) {
	defer s.mutex.RUnlock()
	s.mutex.RLock()
	val, ok := cache.Get(token)
	if ok {
		asID := val.(*tokenModel.Token)
		return asID.Authority, nil
	}
	asID := &tokenModel.Token{}
	session := s.app.Services().Storage().GetDB().Where("token = ?", token).First(asID)
	if session.Error != nil {
		return author.NONE, session.Error
	}
	if session.RecordNotFound() {
		return author.NONE, nil
	}
	cache.Set(token, asID)
	return asID.Authority, nil
}

// Create creates a AccessId obj and returns the token
func (s *Service) Create(authority int, who, note string) (token string, err error) {
	defer s.mutex.Unlock()
	s.mutex.Lock()
	if who == "admin" {
		return "", errors.New("privilegeError")
	}
	retToken := randomKey(64)
	asID := &tokenModel.Token{
		Who:       who,
		Token:     retToken,
		Authority: authority,
	}
	session := s.app.Services().Storage().GetDB().Create(asID)
	cache.Set(retToken, asID)
	return retToken, session.Error
}

// Delete deletes the AccessId obj according to the given token
func (s *Service) Delete(token string) error {
	defer s.mutex.Unlock()
	s.mutex.Lock()
	val, ok := cache.Get(token)
	if ok {
		asID := val.(*tokenModel.Token)
		if asID.Who == "admin" {
			return errors.New("privilegeError")
		}
	} else {
		asID := &tokenModel.Token{}
		session := s.app.Services().Storage().GetDB().Where("token = ?", token).First(asID)
		if session.Error == nil && !session.RecordNotFound() {
			if asID.Who == "admin" {
				return errors.New("privilegeError")
			}
		}
	}
	asID := &tokenModel.Token{
		Token: token,
	}
	cache.Delete(token)
	return s.app.Services().Storage().GetDB().Model(asID).Where("token=?", token).Delete(asID).Error
}

// Update updates the Token obj according to the given token
func (s *Service) Update(token string, authority int) error {
	defer s.mutex.Unlock()
	s.mutex.Lock()
	val, ok := cache.Get(token)
	if ok {
		asID := val.(*tokenModel.Token)
		if asID.Who == "admin" {
			return errors.New("privilegeError")
		}
	} else {
		asID := &tokenModel.Token{}
		session := s.app.Services().Storage().GetDB().Where("token = ?", token).First(asID)
		if session.Error == nil && !session.RecordNotFound() {
			if asID.Who == "admin" {
				return errors.New("privilegeError")
			}
		}
	}
	asID := &tokenModel.Token{}
	session := s.app.Services().Storage().GetDB().Where("token = ?", token).First(asID)
	if session.Error != nil {
		return session.Error
	}
	if session.RecordNotFound() {
		return nil
	}
	asID.Authority = authority
	err := s.app.Services().Storage().GetDB().Model(asID).Where("token=?", token).Update(asID).Error
	cache.Set(token, asID)
	return err
}

// UpdateAdminToken updates the Admin Token obj according to the given token
func (s *Service) UpdateAdminToken(token string) error {
	defer s.mutex.Unlock()
	s.mutex.Lock()
	asID := &tokenModel.Token{}
	session := s.app.Services().Storage().GetDB().Where("who = ?", "admin").First(asID)
	if session.Error != nil {
		return session.Error
	}
	if session.RecordNotFound() {
		return nil
	}
	oldToken := asID.Token
	cache.Delete(oldToken)
	asID.Token = token
	ok := s.app.Services().Storage().GetDB().Model(asID).Where("who=?", "admin").Update(asID).Error
	cache.Set(token, asID)
	return ok
}

// init a Admin AccessId obj
func (s *Service) InitAdminToken() error {
	defer s.mutex.Unlock()
	s.mutex.Lock()
	asID := &tokenModel.Token{}
	session := s.app.Services().Storage().GetDB().Where("who = ?", "admin").First(asID)
	if !session.RecordNotFound() {
		return nil
	}
	if session.Error != nil && !session.RecordNotFound() {
		return session.Error
	}

	asID.Who = "admin"
	asID.Token = s.app.Config().AdminToken
	asID.Authority = authority.ADMIN
	session = s.app.Services().Storage().GetDB().Create(asID)
	if session.Error != nil {
		return session.Error
	}
	cache.Set(asID.Token, asID)
	return nil
}

// =============================================generate random key=============================================

var _randomKey = "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890"

func randomKey(length int) string {
	result := ""
	r := rand.New(rand.NewSource(time.Now().Unix()))
	rkl := len(_randomKey)
	for i := 0; i < length; i++ {
		randInt := r.Intn(rkl)
		result = result + _randomKey[randInt:randInt+1]
	}
	return result
}
