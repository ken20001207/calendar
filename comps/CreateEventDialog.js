import React from "react";

import { FlexboxGrid, Button, Form, FormGroup, FormControl, ControlLabel, CheckboxGroup, Checkbox, SelectPicker, Modal } from "rsuite";

class CreateEventDialog extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        if (this.props.inputing == undefined) return null;

        if (this.props.inputing.allday == undefined || !this.props.inputing.allday.includes("allday"))
            var time = (
                <FormGroup>
                    <ControlLabel>時間</ControlLabel>
                    <FormControl name="time" />
                </FormGroup>
            );
        if (this.props.userdata.calendars != undefined) {
            var calendarOptions = this.props.userdata.calendars.map(calendar => {
                return { label: calendar.title, value: calendar };
            });
        }

        return (
            <Modal show={this.props.creatingEvent} aria-labelledby="form-dialog-title" width="xs">
                <Modal.Header closeButton onClick={this.props.closeEventCreateDialog}>
                    <h5>創建新事件</h5>
                </Modal.Header>
                <Modal.Body>
                    <Form formValue={this.props.inputing} onChange={this.props.handleFormChange}>
                        <FormGroup>
                            <ControlLabel>行事曆</ControlLabel>
                            <FormControl name="calendar" data={calendarOptions} accepter={SelectPicker} />
                        </FormGroup>
                        <FormGroup>
                            <ControlLabel>事件標題</ControlLabel>
                            <FormControl name="title" />
                        </FormGroup>
                        <FormGroup>
                            <ControlLabel>日期</ControlLabel>
                            <FormControl name="date" />
                        </FormGroup>
                        <FormGroup>
                            <FormControl accepter={CheckboxGroup} name="allday">
                                <Checkbox value="allday">全天事件</Checkbox>
                            </FormControl>
                        </FormGroup>
                        {time}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <FlexboxGrid>
                        <FlexboxGrid.Item colspan={3} style={{ textAlign: "left" }}>
                            <Button color="violet" onClick={this.props.openRepeatCreateDialog} loading={this.props.waiting}>
                                創建系列
                            </Button>
                        </FlexboxGrid.Item>
                        <FlexboxGrid.Item colspan={15} />
                        <FlexboxGrid.Item colspan={6} style={{ textAlign: "right" }}>
                            <Button onClick={this.props.closeEventCreateDialog}>取消</Button>
                            <Button appearance="primary" onClick={this.props.createEvent} loading={this.props.waiting}>
                                創立
                            </Button>
                        </FlexboxGrid.Item>
                    </FlexboxGrid>
                </Modal.Footer>
            </Modal>
        );
    }
}

export default CreateEventDialog;
