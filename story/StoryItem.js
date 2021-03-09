import React, { Component } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

import { dots, returnId, seen } from './utils'
import { LABEL_COLOR, BORDER_COLOR, BORDER_WIDTH } from './Constants'

export default class StoryItem extends Component {
    constructor(props) {
        super(props)
        this.size = this.props.size - (this.props.data.seen ? 27 : 30)
        this.id = returnId(this.props.actid,this.props.data.title)
    }

    press() {
        seen(this.id)
        this.props.action(this.props.data)
        this.props.callback(this.id)
    }

    render() {
        const width = this.size,
            height = this.props.rectangle ? this.size * this.props.rectangle : this.size,
            borderRadius = this.props.shape,
            borderColor = this.props.borderColor ? this.props.borderColor : BORDER_COLOR,
            borderWidth = this.props.borderWidth ? parseFloat(this.props.borderWidth) : BORDER_WIDTH,
            color = this.props.labelColor ? this.props.labelColor : LABEL_COLOR
        return (
            <TouchableOpacity
                style={styles.center}
                onPress={() => this.press()}>
                <View style={[
                    styles.itemContainer,
                    { width, height, borderRadius, borderColor, borderWidth },
                    this.props.shadow && styles.shadow,
                    this.props.data.seen && (styles.seen)]}>
                    <Image
                        source={{ uri: this.props.data.image }}
                        style={[styles.item, { borderRadius: borderRadius - 2 }]} />
                </View>
                <Text style={[styles.title, { color }]} numberOfLines={1} >{dots(this.props.data.title, 7)}</Text>
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({
    itemContainer: {
        margin: 3,
        padding: 3,
        marginHorizontal: 5,
    },
    seen: {
        padding: 4,
        borderWidth: 1,
        borderColor: "#aaa"
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontWeight: "400",
    },
    item: {
        flex: 1,
        resizeMode: 'cover',
    },
    shadow: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.32,
        shadowRadius: 5.46,
        elevation: 3,
    }
})