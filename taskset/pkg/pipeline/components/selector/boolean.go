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

import (
	"fmt"
	libList "scheduler/pkg/common/list"
	"unicode/utf8"
)

func validChar(char rune) bool {

	return char >= 'A' && char <= 'z' || char == '&' || char == '|' || char == '(' || char == ' ' || char == '!' || char == ')'
}

func operatorLevel(operator string) int {
	switch operator {
	case "||":
		return 1
	case "&&":
		return 2
	case "!":
		return 3
	}
	return 0
}

//parse boolean expression to Reverse Polish notation
func parse(str string) (*libList.List, error) {
	original := str

	s1 := &libList.List{}
	s2 := &libList.List{}

	var temp string = ""
	var operator string = ""

	for len(str) > 0 {

		char, size := utf8.DecodeRuneInString(str)

		if false == validChar(char) {
			return nil, fmt.Errorf("Invalid char(%c) in bool expression", char)
		}

		str = str[size:]

		if ' ' == char {
			if "" != temp {
				s2.Push(&item{
					value: temp,
					vtype: _TYPE_VARIABLE,
				})
				temp = ""
			}
			continue
		}

		if char == '(' || char == ')' || char == '!' {
			operator = string(char)
		}

		if char == '&' || char == '|' {
			if len(str) == 0 {
				return nil, fmt.Errorf("Wrong operator('%c') in bool expression", char)
			}

			next, size := utf8.DecodeRuneInString(str)

			if next != char {
				return nil, fmt.Errorf("Wrong operator('%c%c') in bool expression", char, next)
			}

			operator = fmt.Sprintf("%c%c", char, char)

			str = str[size:]
		}

		if "" == operator {
			temp += string(char)
			continue

		}

		if "" != temp {
			s2.Push(&item{
				value: temp,
				vtype: _TYPE_VARIABLE,
			})

			temp = ""
		}

		switch operator {
		case "(":
			{
				s1.Push(&item{
					value: operator,
					vtype: _TYPE_OPERATOR,
				})
			}
		case ")":
			{
				found := false

				for s1.Len() > 0 {

					it := s1.Pop().(*item)

					if it.value == "(" {
						found = true
						break
					}

					s2.Push(it)
				}

				if false == found {
					return nil, fmt.Errorf("Invalid boolean expression:%s", original)
				}
			}
		default:
			{
				level := operatorLevel(operator)

				if 0 == s1.Len() {
					s1.Push(&item{
						value: operator,
						vtype: _TYPE_OPERATOR,
					})
				} else {
					for s1.Len() > 0 {
						top := s1.Get(s1.Len() - 1).(*item)

						if "(" == top.value || level > operatorLevel(top.value) {
							s1.Push(&item{
								value: operator,
								vtype: _TYPE_OPERATOR,
							})
							break
						}

						s2.Push(s1.Pop())

						if 0 == s1.Len() {
							s1.Push(&item{
								value: operator,
								vtype: _TYPE_OPERATOR,
							})
							break
						}
					}
				}
			}
		}

		operator = ""
	}

	if "" != temp {
		s2.Push(&item{
			value: temp,
			vtype: _TYPE_VARIABLE,
		})
	}

	for s1.Len() > 0 {
		s2.Push(s1.Pop())
	}

	return s2, nil
}
