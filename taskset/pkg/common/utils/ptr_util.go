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
package utils

import (
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

func PtrString(o string) *string {
	return &o
}

func PtrUint(o uint) *uint {
	return &o
}

func PtrInt32(o int32) *int32 {
	return &o
}

func NilInt32() *int32 {
	return nil
}

func PtrInt64(o int64) *int64 {
	return &o
}

func PtrFloat64(o float64) *float64 {
	return &o
}

func PtrBool(o bool) *bool {
	return &o
}

func NilBool() *bool {
	return nil
}

func PtrUID(o types.UID) *types.UID {
	return &o
}

func PtrUIDStr(s string) *types.UID {
	return PtrUID(types.UID(s))
}

func PtrNow() *meta.Time {
	now := meta.Now()
	return &now
}
