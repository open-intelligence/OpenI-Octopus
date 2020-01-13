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

package statemachine

// State define the state object
type State struct {
	name      string
	condition ConditionFunc
	action    ActionFunc
	next      *State
	reason    string
	switches  []*Switch
}

func (s *State) GetName() string {
	return s.name
}

func (s *State) Condition(fun ConditionFunc) *State {
	s.condition = fun
	return s
}

func (s *State) Action(fun ActionFunc) *State {
	s.action = fun
	return s
}

func (s *State) NextState(state *State, reason string) *State {
	s.next = state
	s.reason = reason
	return s
}

// When is used to declare state-change condition
func (s *State) When(fun TransitionCondFunc) *Case {

	caseSwitch := &Switch{
		when:   fun,
		parent: s,
	}

	caseSwitch.caseYes = &Case{
		parent: caseSwitch,
	}

	s.switches = append(s.switches, caseSwitch)

	return caseSwitch.caseYes
}

type Case struct {
	parent *Switch
	reason string
	state  *State
	next   bool
}

func (c *Case) Else() *Case {
	return c.parent.Else()
}

func (c *Case) When(fun TransitionCondFunc) *Case {
	return c.parent.When(fun)
}

func (c *Case) GoRun() *Case {
	c.next = true
	return c
}

func (c *Case) To(state *State, reason string) *Case {
	c.state = state
	c.reason = reason
	return c
}

//Switch define the StateSwitch object
type Switch struct {
	when    TransitionCondFunc
	caseYes *Case
	caseNo  *Case
	parent  *State
}

func (s *Switch) Else() *Case {
	s.caseNo = &Case{
		parent: s,
	}
	return s.caseNo
}

func (s *Switch) When(fun TransitionCondFunc) *Case {
	return s.parent.When(fun)
}

// NewState is the constructor of State
func NewState(name string) *State {
	s := &State{
		name: name,
	}
	return s
}
