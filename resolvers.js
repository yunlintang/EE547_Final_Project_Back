'use strict';

const { result } = require("lodash");
const ObjectId = require('mongodb').ObjectId;

const resolvers = {
  User: {
    message: ({message}, _, context)=>{
      return message
    },

    username: ({username}, _, context)=>{
      return username
    },

    is_voted: ({ is_voted }, _, context) => {
      return is_voted
    },

    total_reservations: async({ username }, _, context) => {
      let reservation_record = await context.loaders.reservation.load(username);
      return reservation_record.length;
    },

    reservations: async({ username }, _, context) => {
      let reservation_record = await context.loaders.reservation.load(username);
      // console.log('reservation_record', reservation_record)
      return reservation_record;
    },

    // in_active_match: async({ _id }, _, context) => {
    //   let res = await context.loaders.playerjs.load(_id);
    //   console.log(res)
    //   let active_match = null;
    //   if(res.in_active_match !== null){
    //     active_match = await context.loaders.match.load(res.in_active_match);
    //   }
    //   return active_match;
    // },
  },
  Query: {
    user: async(_, {username, password}, context) => {
      let obj = await context.loaders.user.load(username);
      if(obj.length == 0){
        return {
          username: "",
          message: "no records found",
          is_voted: false
        }
      }else if(obj.password != password){
        return {
          username: "",
          message: "not match",
          is_voted: false
        };
      }

      return {
        username: username,
        message: "success",
        is_voted: obj.is_voted
      };
    },

    restaurantList: async(_, {}, context) => {
      let obj = await context.db.collection('Restaurant').find({}).toArray();
      // console.log(obj)
      return obj
    }
  },

  Restaurant:{
    name: ({ name }, _, context) => {
      return name;
    },
    vote_number: ({ vote_number }, _, context) => {
      return vote_number;
    },
    image_url: ({ image_url }, _, context) => {
      // console.log(restaurant)
      return image_url;
    },
  },
  
  Reservation: {
    username: ({ username }, _, context) => {
      return username;
    },
    date: ({ date }, _, context) => {
      return date;
    },
    restaurant: ({ restaurant }, _, context) => {
      // console.log(restaurant)
      return restaurant;
    },
  },


  Mutation: {
    userCreate: async(_, {username, password}={}, context) => {
      let user_obj = await context.loaders.user.load(username);
      // console.log(user_obj)
      if(user_obj.length !== 0){
        return{
          username: "",
          is_voted: false,
          message: "Username used"
        }
      }
      let new_user = {
          username: username,
          password: password,
          is_voted: false,
      }
      // let new_user_obj = 
      await context.db.collection('User').insertOne(new_user);
      // console.log(result_match)
      return {
        username: username,
        is_voted: false,
        message: "success"
      };
    },

    reservationDelete: async(_, {username, restaurant, date}={}, context) => {
      // let temp_id = ObjectId(pid)
      // console.log(pid)
      let whereStr_delete = {
        username: username,
        restaurant: restaurant,
        date: date
      };
      let res_delete = await context.db.collection('Reservation').deleteOne(whereStr_delete);
      if(res_delete.deletedCount >= 1){
          return "delete success";
      }
      return "no record";
    },

    reservationCreate: async(_, {username, restaurant, date}={}, context) => {
      let reservation_obj = await context.loaders.reservation.load(username);

      if(reservation_obj.length !== 0){

        for(let record in reservation_obj){
          if(reservation_obj[record].restaurant == restaurant && reservation_obj[record].date == date)
          {
            return "Reservation already exist"
          }
        }
      }
      let new_reservation = {
          username: username,
          date: date,
          restaurant: restaurant,
      }
      // let new_user_obj = 
      await context.db.collection('Reservation').insertOne(new_reservation);
      // console.log(result_match)
      return "success"
    },

    voteUpdate: async(_, {restaurant, user}={}, context) => {
      let reservation_obj = await context.loaders.restaurant.load(restaurant);
      if(reservation_obj.length !== 0){

        let res_update = await context.db.collection('Restaurant').updateOne(
          {name:restaurant}, 
          {$set: {vote_number: reservation_obj[0].vote_number + 1}})
        // console.log(reservation_obj[0].vote_number)
        // console.log(res_update)
        if(res_update.modifiedCount == 1)
        {
          let res_user_update = await context.db.collection('User').updateOne(
            {username: user},
            {$set: {is_voted: true}}
          )
          return "update successful"
        }
        return "update fail"
      }
      return "restaurant not found"
    }



  
    // playerUpdate: async(_, {pid, playerInput}={}, context) => {
    //   let player = {};
    //   let whereStr = {_id: ObjectId(pid)};
    //   let res_find = await context.loaders.player.load(pid);
    //   if(res_find.length !== 0){
    //     if('is_active' in playerInput){
    //       player['is_active'] = playerInput.is_active;
    //     }
    //     if('lname' in playerInput){
    //       player['lname'] = playerInput.lname
    //     }

    //     if(JSON.stringify(player) !== '{}'){
    //         // console.log('update: ', player)
    //         let res_update = await context.db.collection('player').updateMany(whereStr, {$set: player});
    //     }
    //     let result_player = await context.db.collection('player').find(whereStr).toArray();
    //     return result_player[0];
    //   }
    //   return null;
    // }

  },
};


module.exports = resolvers;
