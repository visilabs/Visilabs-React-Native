import React, { Component } from 'react';
import { View, ScrollView } from 'react-native';
import StoryItem from './StoryItem';
import { storylb,isIOS,evtgif,action_type,apiver } from './Constants'

import { returnSeenStories, clearSeenList, splitParameters, returnBorderRadius, returnActid, returnId } from './utils'

export default class Story extends Component {
    constructor(props) {
        super(props)
        this.size = this.props.size ? this.props.size : (isIOS ? 68 : 100)
        this.state = {
            data:[],
            ready: false
        }
        this.height = this.props.rectangle ? this.size * this.props.rectangle : this.size,
        this.rectangle = this.props.rectangle ? this.props.rectangle : 1
        this.callback = this.callback.bind(this)
        this.storyStyle = {};

        // clearSeenList()

        let properties = this.props.eventParameters ? this.props.eventParameters : {}

        properties["action_type"] = action_type;
        properties["OM.apiver"] = apiver;
        if (this.props.pageName) properties["OM.uri"] = this.props.pageName;
        if (this.props.action_id) properties["action_id"] = this.props.action_id;

        this.api = this.props.api;
        this.api.suggestActionsParams.check(properties, true, (data) => {
            data.json().then((actions) => {
                console.log("actions",actions);
                if (!actions.Story[0]) return
                
                this.story = actions.Story[0].actiondata
                this.storyStyles = JSON.parse(unescape(this.story.ExtendedProps))
                this.storyReportParameters = splitParameters(this.story.report.click)
                this.stories = this.story.stories
                this.storyTemplate = this.story.taTemplate
                this.actid = returnActid(this.storyReportParameters)

                this.stroylbProcess(this.storyTemplate,this.stories,this.storyStyles)
            })
        });
    }

    stroylbProcess(template, stories, styles) {
        if (!template || !stories || !styles) return

        if (template == storylb) {
            this.storyStyle.borderColor = styles.storylb_img_borderColor || false;
            this.storyStyle.borderRadius = returnBorderRadius(styles.storylb_img_borderRadius,this.size);
            this.storyStyle.labelColor = styles.storylb_label_color || false;
            this.storyStyle.borderWidth = styles.storylb_img_borderWidth || false;
            this.storyStyle.shadow = styles.storylb_img_boxShadow ? true : false;

            let data = [];
            stories.forEach((s,i) => {
                data.push({
                    key: i+1,
                    url: s.link,
                    title: s.title,
                    image: s.smallImg,
                    seen: false
                })
            });
            this.seenStories(data)
        }
    }

    seenStories(rawData) {
        returnSeenStories(rawData,(res)=>{
            this.setState({ data: res},()=>{
                this.setState({ready:true})
            })
        },this.actid)
    }

    callback(key) {
        this.sendCampaignParams()
        let newData = this.state.data
        newData.forEach(obj => {
            if (returnId(this.actid,obj.title) === key) {
                obj.seen = true
            }
        });
        this.setState({ data: newData })
    }

    sendCampaignParams(){this.api.customEvent(evtgif,this.storyReportParameters)}

    storyItems = (items) => (
        items.map((item) => {
            return (
                <StoryItem
                    key={item.key}
                    size={this.size}
                    data={item}
                    action={this.props.action ? this.props.action : ()=>{}}
                    callback={this.callback}
                    shape={this.storyStyle.borderRadius}
                    rectangle={this.rectangle}
                    borderColor={this.storyStyle.borderColor}
                    borderWidth={this.storyStyle.borderWidth}
                    labelColor={this.storyStyle.labelColor}
                    shadow={this.storyStyle.shadow}
                    actid={this.actid}
                />
            );
        })
    );

    render() {
        return (
            <View style={{ height: this.height }}>
                {this.state.ready &&
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {this.storyItems(this.state.data)}
                    </ScrollView>
                }
            </View>
        );
    }
}