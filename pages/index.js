import React from "react";
import { Helmet } from "react-helmet";
import DayPicker from "react-day-picker";
import fetch from "isomorphic-unfetch";
import { Transition } from "react-transition-group";

import DayView from "../comps/DayView";
import AllDayEvents from "../comps/AllDayEvents";
import EditEventDialog from "../comps/EditEventDialog";
import CreateEventDialog from "../comps/CreateEventDialog";
import CreateRepeatDialog from "../comps/CreateRepeatDialog";
import { User, Event, Repeat } from "../classes";
import { backendURL, duration, defaultStyle, transitionStyles } from "../config";
import { getDayDescription, displayError, eventsToDispay, allDayEventsToDispay, fillEvents, buildRepeatToEvent } from "../utils/methods";

import { Loader, Panel, Container, FlexboxGrid, Col } from "rsuite";

import "rsuite/lib/styles/themes/dark/index.less";
import "../style.less";

class index extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            waiting: false,
            removing: false,
            selectedDay: new Date(),
            eventsToDispay: [],
            userdata: {},
            filled: [],
            editingEvent: false,
            creatingEvent: false,
            selectedEvent: new Event({
                title: "選中的事件",
                startTime: new Date(),
                endTime: new Date(),
                color: ["#fd3721", "#b721ff"],
                calendarTitle: "哈"
            })
        };
        this.handleDayClick = this.handleDayClick.bind(this);
        this.openEventEditDialog = this.openEventEditDialog.bind(this);
        this.closeEventEditDialog = this.closeEventEditDialog.bind(this);
        this.openEventCreateDialog = this.openEventCreateDialog.bind(this);
        this.closeEventCreateDialog = this.closeEventCreateDialog.bind(this);
        this.openRepeatCreateDialog = this.openRepeatCreateDialog.bind(this);
        this.closeRepeatCreateDialog = this.closeRepeatCreateDialog.bind(this);
        this.updateEvent = this.updateEvent.bind(this);
        this.createEvent = this.createEvent.bind(this);
        this.createRepeat = this.createRepeat.bind(this);
        this.removeEvent = this.removeEvent.bind(this);
        this.handleFormChange = this.handleFormChange.bind(this);
    }

    async handleDayClick(day, { selected }) {
        var newdata = buildRepeatToEvent(this.state.userdata, day);
        await fetch(backendURL + "/api/updateuserdata", { method: "post", body: JSON.stringify({ calendars: newdata.calendars }) });
        this.setState({
            selectedDay: selected ? new Date() : day,
            userdata: newdata
        });
    }

    static async getInitialProps() {
        try {
            const res = await fetch(backendURL + "/api/getuserdata");
            const json = await res.json();
            var userdata = new User(json);
            var etd = eventsToDispay(userdata.calendars, new Date());
            var filled = fillEvents(eventsToDispay(userdata.calendars, new Date()), new Date());
        } catch (err) {
            displayError("發生錯誤 T_T", err);
        }
        return { userdata: userdata, filled: filled, eventsToDispay: etd };
    }

    componentDidMount() {
        setTimeout(() => {
            var filled = fillEvents(this.props.eventsToDispay, new Date());
            this.setState({ filled: filled, userdata: this.props.userdata, loaded: true });
        }, 200);
    }

    openEventEditDialog(event) {
        this.setState({
            selectedEvent: event,
            editingEvent: true,
            inputing: {
                title: event.title,
                date: event.startTime.getFullYear() + "/" + (event.startTime.getMonth() + 1) + "/" + event.startTime.getDate(),
                time: event.startTime.getHours() + ":" + event.startTime.getMinutes() + "~" + event.endTime.getHours() + ":" + event.endTime.getMinutes(),
                ignore: [event.ignore ? "ignore" : null],
                ignoreReason: event.ignoreReason == undefined ? "" : event.ignoreReason,
                allday: [event.isAllDayEvent() ? "allday" : null]
            }
        });
    }

    closeEventEditDialog() {
        this.setState({ editingEvent: false });
    }

    openEventCreateDialog() {
        this.setState({
            creatingEvent: true,
            inputing: {
                title: "",
                date: this.state.selectedDay.getFullYear() + "/" + (this.state.selectedDay.getMonth() + 1) + "/" + this.state.selectedDay.getDate(),
                time: new Date().getHours() + ":" + new Date().getMinutes() + "~" + (new Date().getHours() + 1) + ":" + new Date().getMinutes(),
                calendar: { label: this.state.userdata.calendars[0].title, value: this.state.userdata.calendars[0] },
                allday: [null]
            }
        });
    }

    openRepeatCreateDialog() {
        this.setState({
            creatingEvent: false,
            creatingRepeat: true,
            inputing: {
                title: "",
                startdate: this.state.selectedDay.getFullYear() + "/" + (this.state.selectedDay.getMonth() + 1) + "/" + this.state.selectedDay.getDate(),
                enddate: this.state.selectedDay.getFullYear() + "/" + (this.state.selectedDay.getMonth() + 1) + "/" + this.state.selectedDay.getDate(),
                cycle: "Week",
                repeatData: "",
                time: new Date().getHours() + ":" + new Date().getMinutes() + "~" + (new Date().getHours() + 1) + ":" + new Date().getMinutes(),
                calendar: { label: this.state.userdata.calendars[0].title, value: this.state.userdata.calendars[0] },
                allday: [null]
            }
        });
    }

    closeRepeatCreateDialog() {
        this.setState({ creatingRepeat: false });
    }

    closeEventCreateDialog() {
        this.setState({ creatingEvent: false });
    }

    async createEvent() {
        this.setState({
            waiting: true
        });
        var newStartTime = new Date();
        var newEndTime = new Date();
        newStartTime.setFullYear(this.state.inputing.date.split("/")[0], this.state.inputing.date.split("/")[1] - 1, this.state.inputing.date.split("/")[2]);
        newEndTime.setFullYear(this.state.inputing.date.split("/")[0], this.state.inputing.date.split("/")[1] - 1, this.state.inputing.date.split("/")[2]);
        if (this.state.inputing.allday.includes("allday")) {
            newStartTime.setHours(0, 0);
            newEndTime.setHours(24, 0);
        } else {
            newStartTime.setHours(this.state.inputing.time.split("~")[0].split(":")[0], this.state.inputing.time.split("~")[0].split(":")[1]);
            newEndTime.setHours(this.state.inputing.time.split("~")[1].split(":")[0], this.state.inputing.time.split("~")[1].split(":")[1]);
        }
        var newdata = new User(this.state.userdata);
        newdata.calendars.map(calendar => {
            if (calendar.title == this.state.inputing.calendar.label) {
                calendar.events.push(new Event({ title: this.state.inputing.title, startTime: newStartTime, endTime: newEndTime, color: calendar.color }));
            }
        });
        try {
            await fetch(backendURL + "/api/updateuserdata", { method: "post", body: JSON.stringify({ calendars: newdata.calendars }) });
        } catch (err) {
            displayError("對不起 ... 發生技術性問題啦 T_T", "創建新事件時發生了一些問題，希望你可以與我們聯絡來幫助我們改進 !");
        }
        if (res.status == 200) {
            var etd = eventsToDispay(newdata.calendars, new Date());
            var filled = fillEvents(eventsToDispay(newdata.calendars, new Date()), new Date());
            this.setState({ userdata: userdata, filled: filled, eventsToDispay: etd, waiting: false, creatingEvent: false });
        } else {
            displayError("對不起 ... 發生技術性問題啦 T_T", "創建新系列時發生了一些問題，希望你可以與我們聯絡來幫助我們改進 !");
        }
    }

    async createRepeat() {
        this.setState({
            waiting: true
        });
        var startDate = new Date();
        var endDate = new Date();
        startDate.setFullYear(
            this.state.inputing.startDate.split("/")[0],
            this.state.inputing.startDate.split("/")[1] - 1,
            this.state.inputing.startDate.split("/")[2]
        );
        endDate.setFullYear(this.state.inputing.endDate.split("/")[0], this.state.inputing.endDate.split("/")[1] - 1, this.state.inputing.endDate.split("/")[2]);
        var newStartTime = new Date();
        var newEndTime = new Date();
        newStartTime.setFullYear(
            this.state.inputing.startDate.split("/")[0],
            this.state.inputing.startDate.split("/")[1] - 1,
            this.state.inputing.startDate.split("/")[2]
        );
        newEndTime.setFullYear(
            this.state.inputing.startDate.split("/")[0],
            this.state.inputing.startDate.split("/")[1] - 1,
            this.state.inputing.startDate.split("/")[2]
        );
        if (this.state.inputing.allday.includes("allday")) {
            newStartTime.setHours(0, 0);
            newEndTime.setHours(24, 0);
        } else {
            newStartTime.setHours(this.state.inputing.time.split("~")[0].split(":")[0], this.state.inputing.time.split("~")[0].split(":")[1]);
            newEndTime.setHours(this.state.inputing.time.split("~")[1].split(":")[0], this.state.inputing.time.split("~")[1].split(":")[1]);
        }
        var newdata = new User(this.state.userdata);
        newdata.calendars.map(calendar => {
            if (calendar.title == this.state.inputing.calendar.label) {
                calendar.repeats.push(
                    new Repeat({
                        name: this.state.inputing.title,
                        startDate: startDate,
                        endDate: endDate,
                        startTime: newStartTime,
                        endTime: newEndTime,
                        cycle: this.state.inputing.cycle,
                        repeatData: this.state.inputing.repeatData,
                    })
                );
            }
        });
        var res = null;
        try {
            res = await fetch(backendURL + "/api/updateuserdata", { method: "post", body: JSON.stringify({ calendars: newdata.calendars }) });
        } catch (err) {
            displayError("對不起 ... 發生技術性問題啦 T_T", "創建新系列時發生了一些問題，希望你可以與我們聯絡來幫助我們改進 !");
        }
        if (res.status == 200) {
            var etd = eventsToDispay(newdata.calendars, new Date());
            var filled = fillEvents(eventsToDispay(newdata.calendars, new Date()), new Date());
            this.setState({ userdata: newdata, filled: filled, eventsToDispay: etd, waiting: false, creatingRepeat: false });
        } else {
            displayError("對不起 ... 發生技術性問題啦 T_T", "創建新系列時發生了一些問題，希望你可以與我們聯絡來幫助我們改進 !");
        }
    }

    async updateEvent() {
        this.setState({
            waiting: true
        });
        var newStartTime = new Date();
        var newEndTime = new Date();
        newStartTime.setFullYear(this.state.inputing.date.split("/")[0], this.state.inputing.date.split("/")[1] - 1, this.state.inputing.date.split("/")[2]);
        newEndTime.setFullYear(this.state.inputing.date.split("/")[0], this.state.inputing.date.split("/")[1] - 1, this.state.inputing.date.split("/")[2]);
        if (this.state.inputing.allday.includes("allday")) {
            newStartTime.setHours(0, 0);
            newEndTime.setHours(24, 0);
        } else {
            newStartTime.setHours(this.state.inputing.time.split("~")[0].split(":")[0], this.state.inputing.time.split("~")[0].split(":")[1]);
            newEndTime.setHours(this.state.inputing.time.split("~")[1].split(":")[0], this.state.inputing.time.split("~")[1].split(":")[1]);
        }
        var newdata = new User(this.state.userdata);
        newdata.calendars.map(calendar => {
            calendar.events.map(event => {
                if (event.id == this.state.selectedEvent.id) {
                    event.startTime = newStartTime;
                    event.endTime = newEndTime;
                    event.title = this.state.inputing.title;
                    event.ignore = this.state.inputing.ignore.includes("ignore") ? true : false;
                    event.ignoreReason = this.state.inputing.ignoreReason;
                }
            });
        });
        var res = {};
        try {
            res = await fetch(backendURL + "/api/updateuserdata", { method: "post", body: JSON.stringify({ calendars: newdata.calendars }) });
        } catch (err) {
            displayError("對不起 ... 發生技術性問題啦 T_T", "更新事件時發生了一些問題，希望你可以與我們聯絡來幫助我們改進 !");
        }
        if (res.status == 200) {
            var userdata = new User(newdata);
            var etd = eventsToDispay(userdata.calendars, new Date());
            var filled = fillEvents(eventsToDispay(userdata.calendars, new Date()), new Date());
            this.setState({ userdata: userdata, filled: filled, eventsToDispay: etd, waiting: false, editingEvent: false });
        } else {
            displayError("對不起 ... 發生技術性問題啦 T_T", "更新事件時發生了一些問題，希望你可以與我們聯絡來幫助我們改進 !");
        }
    }

    async removeEvent() {
        this.setState({
            removing: true
        });
        var newdata = new User(this.state.userdata);
        newdata.calendars.map(calendar => {
            var targetEvent = null;
            calendar.events.map(event => {
                if (event.id == this.state.selectedEvent.id) {
                    targetEvent = event;
                }
            });
            if (targetEvent != null) calendar.events.splice(calendar.events.indexOf(targetEvent), 1);
        });
        try {
            await fetch(backendURL + "/api/updateuserdata", { method: "post", body: JSON.stringify({ calendars: newdata.calendars }) });
        } catch (err) {
            displayError("對不起 ... 發生技術性問題啦 T_T", "刪除事件時發生了一些問題，希望你可以與我們聯絡來幫助我們改進 !");
        }
        const res = await fetch(backendURL + "/api/getuserdata");
        const json = await res.json();
        var userdata = new User(json);
        var etd = eventsToDispay(userdata.calendars, new Date());
        var filled = fillEvents(eventsToDispay(userdata.calendars, new Date()), new Date());
        this.setState({ userdata: userdata, filled: filled, eventsToDispay: etd, removing: false, editingEvent: false });
    }

    handleFormChange(value) {
        this.setState({
            inputing: {
                ignoreReason: value.ignoreReason,
                ignore: value.ignore,
                calendar: value.calendar,
                cycle: value.cycle,
                repeatData: value.repeatData,
                time: value.time,
                date: value.date,
                title: value.title,
                allday: value.allday,
                startDate: value.startDate,
                endDate: value.endDate
            }
        });
    }

    render() {
        var DayviewContent = <Loader />;
        var AllDayEventsContent = <Loader />;
        if (this.state.userdata.calendars != undefined) {
            var filled = fillEvents(eventsToDispay(this.state.userdata.calendars, this.state.selectedDay), this.state.selectedDay);
            var allDayEvents = allDayEventsToDispay(this.state.userdata.calendars, this.state.selectedDay);
            DayviewContent = <DayView events={filled} openEventEditDialog={this.openEventEditDialog} openEventCreateDialog={this.openEventCreateDialog} />;
            AllDayEventsContent = (
                <AllDayEvents events={allDayEvents} openEventEditDialog={this.openEventEditDialog} openEventCreateDialog={this.openEventCreateDialog} />
            );
        }

        var dayDescription = getDayDescription(this.state.selectedDay);

        return (
            <Container>
                <Helmet>
                    <title>Reacal : 專注於使用者體驗的日程規劃工具</title>
                </Helmet>

                <FlexboxGrid justify="center">
                    <FlexboxGrid.Item componentClass={Col} colspan={24} xs={20} sm={18} md={12}>
                        <FlexboxGrid justify="space-around">
                            <FlexboxGrid.Item colspan={7}>
                                <div className="app-title">
                                    <h1>Reacal</h1>
                                    <p>專注於使用者體驗的日程規劃工具</p>
                                </div>
                                <div className="day-picker-panel">
                                    <DayPicker selectedDays={this.state.selectedDay} onDayClick={this.handleDayClick} />
                                </div>
                                <div className="day-info">
                                    <h3>
                                        {this.state.selectedDay.getFullYear()} / {this.state.selectedDay.getMonth() + 1} / {this.state.selectedDay.getDate()}
                                    </h3>
                                    <p>{dayDescription}</p>
                                </div>
                                <div className="day-view-panel">
                                    <div className="day-view-scroll">
                                        <Transition in={this.state.loaded} timeout={duration}>
                                            {state => (
                                                <div
                                                    style={{
                                                        ...defaultStyle,
                                                        ...transitionStyles[state]
                                                    }}
                                                >
                                                    {AllDayEventsContent}
                                                </div>
                                            )}
                                        </Transition>
                                    </div>
                                </div>
                            </FlexboxGrid.Item>
                            <FlexboxGrid.Item colspan={14}>
                                <Panel style={{ marginLeft: 60 }} bodyFill>
                                    <div
                                        style={{
                                            overflowY: "scroll",
                                            maxHeight: "100vh",
                                            padding: 48
                                        }}
                                    >
                                        <Transition in={this.state.loaded} timeout={duration}>
                                            {state => (
                                                <div
                                                    style={{
                                                        ...defaultStyle,
                                                        ...transitionStyles[state]
                                                    }}
                                                >
                                                    {DayviewContent}
                                                </div>
                                            )}
                                        </Transition>
                                    </div>
                                </Panel>
                            </FlexboxGrid.Item>
                        </FlexboxGrid>
                    </FlexboxGrid.Item>
                </FlexboxGrid>

                <EditEventDialog
                    editingEvent={this.state.editingEvent}
                    closeEventEditDialog={this.closeEventEditDialog}
                    selectedEvent={this.state.selectedEvent}
                    inputing={this.state.inputing}
                    handleFormChange={this.handleFormChange}
                    removeEvent={this.removeEvent}
                    removing={this.state.removing}
                    updateEvent={this.updateEvent}
                    waiting={this.state.waiting}
                />

                <CreateEventDialog
                    userdata={this.state.userdata}
                    creatingEvent={this.state.creatingEvent}
                    closeEventCreateDialog={this.closeEventCreateDialog}
                    inputing={this.state.inputing}
                    handleFormChange={this.handleFormChange}
                    createEvent={this.createEvent}
                    waiting={this.state.waiting}
                    openRepeatCreateDialog={this.openRepeatCreateDialog}
                />

                <CreateRepeatDialog
                    userdata={this.state.userdata}
                    creatingRepeat={this.state.creatingRepeat}
                    closeRepeatCreateDialog={this.closeRepeatCreateDialog}
                    inputing={this.state.inputing}
                    handleFormChange={this.handleFormChange}
                    createRepeat={this.createRepeat}
                    waiting={this.state.waiting}
                />
            </Container>
        );
    }
}

export default index;
