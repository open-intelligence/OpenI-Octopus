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

import "fmt"

// StateMachine declare the state machine
type StateMachine struct {
	states             []*State
	stateChangeHandler StateChangeHandler
	unexpectedHandler  UnexpectedHandler
}

// Run  starts the state machine
func (m *StateMachine) Run(args ...interface{}) error {

	var match bool = false
	var reason string = ""

	var state *State

	var stateSwitch *Switch

	var err error = nil

	// should only match  at least one
	for i := 0; i < len(m.states); i++ {

		match = m.states[i].condition(args...)

		if false == match {
			continue
		}

		state = m.states[i]

		break
	}

	if state == nil {

		if nil != m.unexpectedHandler {
			return m.unexpectedHandler(args...)
		}

		return fmt.Errorf("StateMachine: Unexpected situation happened")
	}

	if nil != state.action {

		err = state.action(args...)

		if err != nil {
			return err
		}

		if nil != state.next {
			err = m.execStateChangeHandler(state, state.next, state.reason, args...)
		}

		if err != nil {
			return err
		}
	}

	if len(state.switches) <= 0 {
		return nil
	}

	// should only match at least one
	for k := 0; k < len(state.switches); k++ {

		match, reason = state.switches[k].when(args...)

		if false == match && nil == state.switches[k].caseNo {
			continue
		}

		if false == match && nil == state.switches[k].caseNo.state {
			continue
		}

		if true == match && nil == state.switches[k].caseYes {
			continue
		}

		if true == match && nil == state.switches[k].caseYes.state {
			continue
		}

		stateSwitch = state.switches[k]

		break
	}

	if nil == stateSwitch {
		return err
	}

	if true == match {
		if "" == reason {
			reason = stateSwitch.caseYes.reason
		}

		err = m.execStateChangeHandler(state, stateSwitch.caseYes.state, reason, args...)

		if nil != err && stateSwitch.caseYes.next {
			return m.Run(args...)
		}

	} else {
		if "" == reason {
			reason = stateSwitch.caseNo.reason
		}

		err = m.execStateChangeHandler(state, stateSwitch.caseNo.state, reason, args...)

		if err != nil && stateSwitch.caseNo.next {
			return m.Run(args...)
		}
	}

	return err
}

// Register is used to register states to the machine
func (m *StateMachine) Register(states ...*State) *StateMachine {
	m.states = append(m.states, states...)
	return m
}

func (m *StateMachine) execStateChangeHandler(pre, next *State, changenote string, args ...interface{}) error {
	if nil != m.stateChangeHandler {
		err := m.stateChangeHandler(pre, next, changenote, args...)
		return err
	}

	return nil
}

// OnStateChange is used to register state-change handler
func (m *StateMachine) OnStateChange(handler StateChangeHandler) *StateMachine {
	m.stateChangeHandler = handler
	return m
}

// OnUnexpectedSituation is used to register the unexpected situation handler
func (m *StateMachine) OnUnexpectedSituation(fun UnexpectedHandler) *StateMachine {
	m.unexpectedHandler = fun
	return m
}

// NewStateMachine returns a new StateMachine
func NewStateMachine() *StateMachine {
	m := &StateMachine{}
	return m
}
